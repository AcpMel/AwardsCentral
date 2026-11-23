"use client";

import {
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import type { ChangeEvent } from "react";

import { Canvas, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";

import {
    Box3,
    CanvasTexture,
    DoubleSide,
    MathUtils,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Object3D,
    Quaternion,
    Raycaster,
    SRGBColorSpace,
    Vector2,
    Vector3,
} from "three";
import type { Intersection } from "three";

import { DecalGeometry } from "three/addons/geometries/DecalGeometry.js";

/* =========================================================
   TYPES
========================================================= */

type Finish = "gold" | "silver" | "bronze" | "rose-gold" | "black";
type DesignArea = "body" | "base";
type ElementType = "text" | "image";

type ViewSide =
    | "auto-front"
    | "auto-back"
    | "x+"
    | "x-"
    | "z+"
    | "z-"
    | "y+";

/**
 * Where an element sits on the model.
 * Stored in the LOCAL space of the target mesh, so it is independent
 * of the preview scaling / centering applied to the product.
 */
type Placement = {
    point: [number, number, number];
    normal: [number, number, number];
};

export type DesignElement = {
    id: string;
    type: ElementType;
    area: DesignArea;
    text: string;
    color: string;
    fontId: string;
    imageDataUrl: string | null;
    imageName: string | null;
    /** Width of the element as a fraction of the product's face width. */
    scale: number;
    /** Roll around the surface normal, in degrees. */
    rotation: number;
    /** null = "not placed yet", the 3D scene places it on the current view. */
    placement: Placement | null;
};

export type ProductCustomization = {
    finish: Finish;
    background: string;
    elements: DesignElement[];
};

type ProductCustomizerProps = {
    modelUrl: string;
    productName?: string;
    onCustomizationChange?: (customization: ProductCustomization) => void;
    onSave?: (customization: ProductCustomization) => void | Promise<void>;
};

/* =========================================================
   CONFIG
========================================================= */

const FINISHES: { id: Finish; label: string; color: string }[] = [
    { id: "gold", label: "Gold", color: "#d6ad45" },
    { id: "silver", label: "Silver", color: "#c5cbd1" },
    { id: "bronze", label: "Bronze", color: "#a96837" },
    { id: "rose-gold", label: "Rose Gold", color: "#c98d7c" },
    { id: "black", label: "Black", color: "#292929" },
];

const FINISH_COLORS: Record<Finish, string> = {
    gold: "#d6ad45",
    silver: "#c5cbd1",
    bronze: "#a96837",
    "rose-gold": "#c98d7c",
    black: "#292929",
};

const BACKGROUNDS = [
    { color: "#f1e6d6", label: "Warm" },
    { color: "#dfe6ee", label: "Cool" },
    { color: "#14142b", label: "Dark" },
    { color: "#ffffff", label: "White" },
];

const FONT_OPTIONS = [
    { id: "default", label: "Default", family: "Arial, Helvetica, sans-serif" },
    { id: "serif", label: "Serif", family: "Georgia, 'Times New Roman', serif" },
    {
        id: "script",
        label: "Script",
        family: "'Brush Script MT', 'Segoe Script', cursive",
    },
    { id: "mono", label: "Monospace", family: "'Courier New', monospace" },
    { id: "impact", label: "Impact", family: "Impact, 'Arial Black', sans-serif" },
];

const VIEWS: { id: ViewSide; label: string }[] = [
    { id: "auto-front", label: "Auto Front" },
    { id: "auto-back", label: "Auto Back" },
    { id: "x+", label: "X+ Front" },
    { id: "x-", label: "X- Back" },
    { id: "z+", label: "Z+ Front" },
    { id: "z-", label: "Z- Back" },
    { id: "y+", label: "Top" },
];

const AXIS_DIRECTIONS = [
    new Vector3(1, 0, 0),
    new Vector3(-1, 0, 0),
    new Vector3(0, 0, 1),
    new Vector3(0, 0, -1),
    new Vector3(0, 1, 0),
];

const fontFamilyOf = (fontId: string): string =>
    FONT_OPTIONS.find((font) => font.id === fontId)?.family ??
    FONT_OPTIONS[0].family;

const createId = (): string =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/* =========================================================
   MODEL URL
========================================================= */

function resolveModelUrl(modelUrl: string): string {
    if (
        modelUrl.startsWith("http://") ||
        modelUrl.startsWith("https://") ||
        modelUrl.startsWith("blob:") ||
        modelUrl.startsWith("data:")
    ) {
        return modelUrl;
    }

    const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

    const apiOrigin = new URL(apiUrl).origin;

    return `${apiOrigin}${modelUrl.startsWith("/") ? "" : "/"}${modelUrl}`;
}

/* =========================================================
   GEOMETRY HELPERS
========================================================= */

/**
 * World-space bounding box of ONE mesh, computed from its own geometry.
 * (Box3.setFromObject would also include child decals, which changes
 * the size every time a decal is added.)
 */
function getMeshWorldBox(mesh: Mesh): Box3 {
    mesh.updateWorldMatrix(true, false);

    if (!mesh.geometry.boundingBox) {
        mesh.geometry.computeBoundingBox();
    }

    return mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld);
}

/**
 * Converts a raycast hit into a placement stored in the mesh's local space.
 * The normal is flipped so it always faces the viewer / ray origin.
 */
function hitToPlacement(
    target: Mesh,
    hit: Intersection<Object3D>,
    rayDirection: Vector3
): Placement | null {
    if (!hit.face) {
        return null;
    }

    target.updateWorldMatrix(true, false);

    const localPoint = target.worldToLocal(hit.point.clone());
    const localNormal = hit.face.normal.clone();

    const worldNormal = localNormal
        .clone()
        .transformDirection(target.matrixWorld);

    if (worldNormal.dot(rayDirection) > 0) {
        localNormal.negate();
    }

    return {
        point: localPoint.toArray() as [number, number, number],
        normal: localNormal.toArray() as [number, number, number],
    };
}

/**
 * Shoots rays at the mesh from the given directions (in order) and
 * returns the first real surface hit. This replaces the old hard-coded
 * "X+ face" assumption: the decal is always placed on a real surface
 * and follows the real surface normal.
 */
function findPlacement(target: Mesh, directions: Vector3[]): Placement | null {
    const box = getMeshWorldBox(target);

    const center = box.getCenter(new Vector3());
    const reach = box.getSize(new Vector3()).length() + 1;

    const raycaster = new Raycaster();

    for (const direction of directions) {
        const origin = center.clone().addScaledVector(direction, reach);

        raycaster.set(origin, direction.clone().negate());

        const hit = raycaster.intersectObject(target, false)[0];

        if (hit) {
            const placement = hitToPlacement(
                target,
                hit,
                raycaster.ray.direction
            );

            if (placement) {
                return placement;
            }
        }
    }

    return null;
}

/**
 * Shrinks a decal until it sits entirely on ONE flat surface.
 * A 5x5 grid of rays is cast across the decal rectangle; every ray must
 * hit a surface facing the same way (same normal, same depth). This keeps
 * text from crossing bevels / gem facets / edges, where an orthographic
 * projection would look skewed or clipped.
 */
function fitToFlatFace(
    target: Mesh,
    point: Vector3,
    normal: Vector3,
    aspect: number,
    maxWidth: number,
    rollDeg: number
): { width: number; height: number } {
    const up =
        Math.abs(normal.y) > 0.95 ? new Vector3(0, 0, -1) : new Vector3(0, 1, 0);

    const right = new Vector3().crossVectors(up, normal).normalize();
    const vertical = new Vector3().crossVectors(normal, right).normalize();

    const roll = new Quaternion().setFromAxisAngle(
        normal,
        MathUtils.degToRad(rollDeg)
    );

    right.applyQuaternion(roll);
    vertical.applyQuaternion(roll);

    const raycaster = new Raycaster();
    const rayStart = 0.5;

    let width = maxWidth;

    for (let step = 0; step < 24; step++, width *= 0.92) {
        const height = width / aspect;
        let flat = true;

        for (let a = -2; a <= 2 && flat; a++) {
            for (let b = -2; b <= 2 && flat; b++) {
                const sample = point
                    .clone()
                    .addScaledVector(right, (a / 2) * (width / 2))
                    .addScaledVector(vertical, (b / 2) * (height / 2));

                raycaster.set(
                    sample.clone().addScaledVector(normal, rayStart),
                    normal.clone().negate()
                );

                const hit = raycaster.intersectObject(target, false)[0];

                if (!hit || !hit.face) {
                    flat = false;
                    break;
                }

                const hitNormal = hit.face.normal
                    .clone()
                    .transformDirection(target.matrixWorld);

                flat =
                    hitNormal.dot(normal) > 0.98 &&
                    Math.abs(hit.distance - rayStart) < 0.01;
            }
        }

        if (flat) {
            return { width, height };
        }
    }

    return { width, height: width / aspect };
}

/**
 * Turns a view option into a direction from the model toward the camera.
 * "auto" uses the thinnest axis of the body, because the broad face of a
 * medal / plaque is perpendicular to its thickness.
 */
function resolveViewDirection(view: ViewSide, body: Mesh | null): Vector3 {
    switch (view) {
        case "x+":
            return new Vector3(1, 0, 0);
        case "x-":
            return new Vector3(-1, 0, 0);
        case "z+":
            return new Vector3(0, 0, 1);
        case "z-":
            return new Vector3(0, 0, -1);
        case "y+":
            return new Vector3(0, 1, 0);
        default:
            break;
    }

    const size = body
        ? getMeshWorldBox(body).getSize(new Vector3())
        : new Vector3(1, 1, 1);

    let axis: "x" | "y" | "z" = "z";

    if (size.x <= size.y && size.x <= size.z) {
        axis = "x";
    } else if (size.y <= size.x && size.y <= size.z) {
        axis = "y";
    }

    const direction = new Vector3();
    direction[axis] = view === "auto-back" ? -1 : 1;

    return direction;
}

/* =========================================================
   TEXTURE BUILDER (text or image -> CanvasTexture)
   The canvas has the same aspect ratio as the content, so the
   projected decal is never stretched.
========================================================= */

type BuiltTexture = {
    texture: CanvasTexture;
    aspect: number;
};

function buildElementTexture(
    type: ElementType,
    text: string,
    color: string,
    fontFamily: string,
    imageDataUrl: string | null
): Promise<BuiltTexture> {
    return new Promise((resolve, reject) => {
        const finishTexture = (canvas: HTMLCanvasElement) => {
            const texture = new CanvasTexture(canvas);

            texture.colorSpace = SRGBColorSpace;
            texture.anisotropy = 8;
            texture.needsUpdate = true;

            resolve({ texture, aspect: canvas.width / canvas.height });
        };

        /* ---------- IMAGE ---------- */

        if (type === "image") {
            if (!imageDataUrl) {
                reject(new Error("Image element has no image data."));
                return;
            }

            const image = new Image();

            image.onload = () => {
                const ratio = Math.min(
                    1,
                    1024 / Math.max(image.width, image.height)
                );

                const canvas = document.createElement("canvas");

                canvas.width = Math.max(1, Math.round(image.width * ratio));
                canvas.height = Math.max(1, Math.round(image.height * ratio));

                canvas
                    .getContext("2d")
                    ?.drawImage(image, 0, 0, canvas.width, canvas.height);

                finishTexture(canvas);
            };

            image.onerror = () => reject(new Error("Unable to load image."));
            image.src = imageDataUrl;

            return;
        }

        /* ---------- TEXT ---------- */

        const lines = (text.trim() ? text : " ").split("\n");

        const fontSize = 160;
        const padding = 30;
        const lineHeight = fontSize * 1.2;
        const font = `bold ${fontSize}px ${fontFamily}`;

        const measureContext = document.createElement("canvas").getContext("2d");

        if (!measureContext) {
            reject(new Error("Unable to create canvas context."));
            return;
        }

        measureContext.font = font;

        const textWidth = Math.max(
            ...lines.map((line) => measureContext.measureText(line).width),
            fontSize * 0.5
        );

        const fullWidth = textWidth + padding * 2;
        const fullHeight = lines.length * lineHeight + padding * 2;

        // keep the texture a sensible size
        const shrink = Math.min(1, 2048 / fullWidth);

        const canvas = document.createElement("canvas");

        canvas.width = Math.ceil(fullWidth * shrink);
        canvas.height = Math.ceil(fullHeight * shrink);

        const context = canvas.getContext("2d");

        if (!context) {
            reject(new Error("Unable to create canvas context."));
            return;
        }

        context.scale(shrink, shrink);
        context.font = font;
        context.fillStyle = color;
        context.textAlign = "center";
        context.textBaseline = "middle";

        lines.forEach((line, index) => {
            context.fillText(
                line,
                fullWidth / 2,
                padding + lineHeight * (index + 0.5)
            );
        });

        finishTexture(canvas);
    });
}

/* =========================================================
   ELEMENT DECAL
   One decal per design element (text or image).

   1. Texture is built whenever the content changes.
   2. Geometry is rebuilt whenever placement / size / rotation
      changes (dragging), without rebuilding the texture.
   3. The decal is a CHILD of the target mesh, so it is part of
      the 3D model: it rotates, scales and moves with it.
========================================================= */

type ElementDecalProps = {
    element: DesignElement;
    target: Mesh;
};

function ElementDecal({ element, target }: ElementDecalProps) {
    const { id, type, text, color, fontId, imageDataUrl } = element;
    const { placement, scale, rotation } = element;

    const [built, setBuilt] = useState<BuiltTexture | null>(null);

    /* ---------- 1. texture ---------- */

    useEffect(() => {
        let active = true;
        let created: CanvasTexture | null = null;

        buildElementTexture(
            type,
            text,
            color,
            fontFamilyOf(fontId),
            imageDataUrl
        )
            .then((result) => {
                if (!active) {
                    result.texture.dispose();
                    return;
                }

                created = result.texture;
                setBuilt(result);
            })
            .catch((error) => {
                console.error("Product customizer: texture failed.", error);
            });

        return () => {
            active = false;
            created?.dispose();
        };
    }, [type, text, color, fontId, imageDataUrl]);

    /* ---------- 2. decal geometry ---------- */

    useEffect(() => {
        if (!built || !placement) {
            return;
        }

        target.updateWorldMatrix(true, false);

        const box = getMeshWorldBox(target);
        const size = box.getSize(new Vector3());

        /*
         * Reference width = widest horizontal span of the target mesh.
         * Height follows the content's own aspect ratio, so the
         * engraving is never stretched.
         */

        const referenceWidth = Math.max(size.x, size.z);

        /*
         * Keep the projection shallower than the thinnest dimension
         * so it cannot leak through to the opposite face.
         */

        const thinnest = Math.min(size.x, size.y, size.z);
        const decalDepth = Math.max(thinnest * 0.8, 0.02);

        /* local placement -> world space (DecalGeometry works in world space) */

        const worldPoint = new Vector3(...placement.point).applyMatrix4(
            target.matrixWorld
        );

        const worldNormal = new Vector3(...placement.normal)
            .transformDirection(target.matrixWorld)
            .normalize();

        /*
         * Size the decal to the requested width, then shrink it until it
         * fits entirely on one flat surface (no bevels, no edges). Height
         * always follows the content's aspect ratio: never stretched.
         */

        const { width: decalWidth, height: decalHeight } = fitToFlatFace(
            target,
            worldPoint,
            worldNormal,
            built.aspect,
            referenceWidth * scale,
            rotation
        );

        /*
         * Orient the projector so its +Z follows the surface normal.
         * lookAt keeps world-Y as "up" so text stays upright. When the
         * surface faces straight up/down, use another up vector.
         */

        const helper = new Object3D();

        helper.position.copy(worldPoint);
        helper.up.set(0, 1, 0);

        if (Math.abs(worldNormal.y) > 0.95) {
            helper.up.set(0, 0, -1);
        }

        helper.lookAt(worldPoint.clone().add(worldNormal));
        helper.rotateZ(MathUtils.degToRad(rotation));

        let geometry: DecalGeometry;

        try {
            geometry = new DecalGeometry(
                target,
                worldPoint,
                helper.rotation,
                new Vector3(decalWidth, decalHeight, decalDepth)
            );
        } catch (error) {
            console.error("Product customizer: decal projection failed.", error);
            return;
        }

        if ((geometry.attributes.position?.count ?? 0) === 0) {
            geometry.dispose();
            return;
        }

        /* world space -> target-local space, so the decal follows the mesh */

        geometry.applyMatrix4(
            new Matrix4().copy(target.matrixWorld).invert()
        );

        const material = new MeshBasicMaterial({
            map: built.texture,
            transparent: true,
            side: DoubleSide,
            depthTest: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            toneMapped: false,
        });

        const decal = new Mesh(geometry, material);

        decal.name = "ProductCustomizationDecal";
        decal.userData.elementId = id;
        decal.renderOrder = 10;
        decal.frustumCulled = false;

        target.add(decal);

        return () => {
            target.remove(decal);
            geometry.dispose();
            material.dispose();
        };
    }, [built, placement, scale, rotation, target, id]);

    return null;
}

/* =========================================================
   AWARD MODEL
========================================================= */

type AwardModelProps = {
    modelUrl: string;
    finish: Finish;
    elements: DesignElement[];
    selectedId: string | null;
    view: ViewSide;
    viewNonce: number;
    onSelect: (id: string | null) => void;
    onPlace: (id: string, placement: Placement) => void;
    onBaseAvailable: (available: boolean) => void;
};

function AwardModel({
    modelUrl,
    finish,
    elements,
    selectedId,
    view,
    viewNonce,
    onSelect,
    onPlace,
    onBaseAvailable,
}: AwardModelProps) {
    const { scene } = useGLTF(modelUrl);
    const { camera, gl } = useThree();

    const controls = useThree((state) => state.controls) as unknown as {
        enabled: boolean;
        target: Vector3;
        update: () => void;
    } | null;

    const [dragId, setDragId] = useState<string | null>(null);

    const elementsRef = useRef(elements);
    elementsRef.current = elements;

    /* ---------- clone, pick body + base, normalize ---------- */

    const { model, bodyMesh, baseMesh, scale, center } = useMemo(() => {
        const clonedModel = scene.clone(true);

        const candidates: { mesh: Mesh; height: number; centerY: number }[] =
            [];

        clonedModel.traverse((object: Object3D) => {
            if (!(object instanceof Mesh)) {
                return;
            }

            if (Array.isArray(object.material)) {
                object.material = object.material.map((material) =>
                    material.clone()
                );
            } else {
                object.material = object.material.clone();
            }

            const box = getMeshWorldBox(object);
            const size = box.getSize(new Vector3());
            const boxCenter = box.getCenter(new Vector3());

            candidates.push({
                mesh: object,
                height: size.y,
                centerY: boxCenter.y,
            });
        });

        if (candidates.length === 0) {
            console.error("Product customizer: no mesh found in GLB.");
        }

        /*
         * Prefer meshes literally named "Body" / "Base" (rename them in
         * Blender). Fall back to a height heuristic: tallest mesh = body,
         * lowest of the remaining meshes = base.
         */

        const byName = (name: string): Mesh | null =>
            candidates.find(
                (item) =>
                    item.mesh.name.toLowerCase().replace(/[^a-z]/g, "") === name
            )?.mesh ?? null;

        candidates.sort((a, b) => b.height - a.height);

        const body = byName("body") ?? candidates[0]?.mesh ?? null;

        const rest = candidates
            .filter((item) => item.mesh !== body)
            .sort((a, b) => a.centerY - b.centerY);

        const base = byName("base") ?? rest[0]?.mesh ?? null;

        const wholeBox = new Box3().setFromObject(clonedModel);
        const modelSize = wholeBox.getSize(new Vector3());
        const modelCenter = wholeBox.getCenter(new Vector3());

        const largest = Math.max(modelSize.x, modelSize.y, modelSize.z, 0.001);

        return {
            model: clonedModel,
            bodyMesh: body,
            baseMesh: base,
            scale: 2.5 / largest,
            center: modelCenter,
        };
    }, [scene]);

    const targetFor = useCallback(
        (area: DesignArea): Mesh | null =>
            area === "base" && baseMesh ? baseMesh : bodyMesh,
        [bodyMesh, baseMesh]
    );

    useEffect(() => {
        onBaseAvailable(Boolean(baseMesh));
    }, [baseMesh, onBaseAvailable]);

    /* ---------- finish ---------- */

    useEffect(() => {
        model.traverse((object: Object3D) => {
            if (!(object instanceof Mesh)) {
                return;
            }

            const materials = Array.isArray(object.material)
                ? object.material
                : [object.material];

            materials.forEach((material) => {
                if (!(material instanceof MeshStandardMaterial)) {
                    return;
                }

                material.color.set(FINISH_COLORS[finish]);
                material.metalness = finish === "black" ? 0.65 : 0.85;
                material.roughness = finish === "black" ? 0.32 : 0.24;
                material.needsUpdate = true;
            });
        });
    }, [model, finish]);

    /* ---------- camera follows the selected view ---------- */

    useEffect(() => {
        const direction = resolveViewDirection(view, bodyMesh);

        if (Math.abs(direction.y) > 0.95) {
            direction.z += 0.001; // avoid a degenerate "up" at the pole
        } else {
            direction.y += 0.12; // tiny elevation so it still feels 3D
        }

        direction.normalize();

        camera.position.copy(direction).multiplyScalar(6);
        camera.up.set(0, 1, 0);
        camera.lookAt(0, 0, 0);

        if (controls) {
            controls.target.set(0, 0, 0);
            controls.update();
        }
    }, [view, viewNonce, bodyMesh, camera, controls]);

    /* ---------- place new / reset elements on the current view ---------- */

    useEffect(() => {
        const pending = elements.filter((element) => !element.placement);

        if (pending.length === 0) {
            return;
        }

        const viewDirection = resolveViewDirection(view, bodyMesh);
        const directions = [viewDirection, ...AXIS_DIRECTIONS];

        pending.forEach((element) => {
            const target = targetFor(element.area);

            if (!target) {
                return;
            }

            const placement = findPlacement(target, directions);

            if (placement) {
                onPlace(element.id, placement);
            } else {
                console.error(
                    "Product customizer: no surface found for element.",
                    element.id
                );
            }
        });
    }, [elements, view, bodyMesh, targetFor, onPlace]);

    /* ---------- dragging an element across the surface ---------- */

    useEffect(() => {
        if (!dragId) {
            return;
        }

        const element = gl.domElement;
        const raycaster = new Raycaster();
        const pointer = new Vector2();

        if (controls) {
            controls.enabled = false;
        }

        const handleMove = (event: PointerEvent) => {
            const current = elementsRef.current.find(
                (item) => item.id === dragId
            );

            if (!current) {
                return;
            }

            const target = targetFor(current.area);

            if (!target) {
                return;
            }

            const rect = element.getBoundingClientRect();

            pointer.set(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );

            raycaster.setFromCamera(pointer, camera);

            // only the real body/base surface, never the decals
            const hit = raycaster.intersectObject(target, false)[0];

            if (!hit) {
                return;
            }

            const placement = hitToPlacement(
                target,
                hit,
                raycaster.ray.direction
            );

            if (placement) {
                onPlace(dragId, placement);
            }
        };

        const handleUp = () => setDragId(null);

        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
        window.addEventListener("pointercancel", handleUp);

        return () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
            window.removeEventListener("pointercancel", handleUp);

            if (controls) {
                controls.enabled = true;
            }
        };
    }, [dragId, controls, camera, gl, targetFor, onPlace]);

    /* ---------- pointer: grab an element ---------- */

    const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
        const first = event.intersections[0];

        if (!first) {
            return;
        }

        // an element only counts if it is on the visible (nearest) surface
        const grabbed = event.intersections.find(
            (hit) =>
                hit.object.userData?.elementId &&
                hit.distance <= first.distance + 0.01
        );

        if (!grabbed) {
            return;
        }

        event.stopPropagation();

        if (controls) {
            controls.enabled = false;
        }

        onSelect(grabbed.object.userData.elementId as string);
        setDragId(grabbed.object.userData.elementId as string);
    };

    return (
        <>
            <group
                scale={scale}
                position={[
                    -center.x * scale,
                    -center.y * scale,
                    -center.z * scale,
                ]}
                onPointerDown={handlePointerDown}
                onPointerMove={(event) => {
                    const over = event.intersections.some(
                        (hit) => hit.object.userData?.elementId
                    );

                    gl.domElement.style.cursor = over
                        ? dragId
                            ? "grabbing"
                            : "grab"
                        : "";
                }}
                onPointerOut={() => {
                    gl.domElement.style.cursor = "";
                }}
            >
                <primitive object={model} />
            </group>

            {elements.map((element) => {
                const target = targetFor(element.area);

                return target ? (
                    <ElementDecal
                        key={element.id}
                        element={element}
                        target={target}
                    />
                ) : null;
            })}
        </>
    );
}

/* =========================================================
   MAIN PRODUCT CUSTOMIZER
========================================================= */

export default function ProductCustomizer({
    modelUrl,
    productName = "Product",
    onCustomizationChange,
    onSave,
}: ProductCustomizerProps) {
    const [finish, setFinish] = useState<Finish>("gold");
    const [background, setBackground] = useState(BACKGROUNDS[1].color);

    const [designArea, setDesignArea] = useState<DesignArea>("body");
    const [hasBase, setHasBase] = useState(true);

    const [elements, setElements] = useState<DesignElement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [view, setView] = useState<ViewSide>("auto-front");
    const [viewNonce, setViewNonce] = useState(0);

    const [isSaving, setIsSaving] = useState(false);

    const imageInputRef = useRef<HTMLInputElement | null>(null);

    const resolvedModelUrl = useMemo(
        () => resolveModelUrl(modelUrl),
        [modelUrl]
    );

    const selectedElement =
        elements.find((element) => element.id === selectedId) ?? null;

    const customization = useMemo<ProductCustomization>(
        () => ({ finish, background, elements }),
        [finish, background, elements]
    );

    useEffect(() => {
        onCustomizationChange?.(customization);
    }, [customization, onCustomizationChange]);

    /* ---------- element helpers ---------- */

    const updateElement = useCallback(
        (id: string, patch: Partial<DesignElement>) => {
            setElements((current) =>
                current.map((element) =>
                    element.id === id ? { ...element, ...patch } : element
                )
            );
        },
        []
    );

    const handlePlace = useCallback(
        (id: string, placement: Placement) => updateElement(id, { placement }),
        [updateElement]
    );

    const addTextElement = () => {
        const element: DesignElement = {
            id: createId(),
            type: "text",
            area: designArea,
            text: "Your Text",
            color: "#111111",
            fontId: "default",
            imageDataUrl: null,
            imageName: null,
            scale: 0.5,
            rotation: 0,
            placement: null,
        };

        setElements((current) => [...current, element]);
        setSelectedId(element.id);
    };

    const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file.");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result !== "string") {
                return;
            }

            const element: DesignElement = {
                id: createId(),
                type: "image",
                area: designArea,
                text: "",
                color: "#111111",
                fontId: "default",
                imageDataUrl: reader.result,
                imageName: file.name,
                scale: 0.35,
                rotation: 0,
                placement: null,
            };

            setElements((current) => [...current, element]);
            setSelectedId(element.id);
        };

        reader.onerror = () => alert("Unable to read the selected image.");

        reader.readAsDataURL(file);
    };

    const removeElement = (id: string) => {
        setElements((current) => current.filter((element) => element.id !== id));
        setSelectedId((current) => (current === id ? null : current));
    };

    const handleSave = async () => {
        if (elements.length === 0) {
            alert("Please add text or an image before saving.");
            return;
        }

        try {
            setIsSaving(true);
            await onSave?.(customization);
        } catch (error) {
            console.error("Unable to save customization:", error);
            alert("Unable to save your customization. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    /* element labels: "Text 1: ...", "Image 1: ..." */

    const elementLabels = useMemo(() => {
        let textCount = 0;
        let imageCount = 0;

        return elements.map((element) => {
            if (element.type === "text") {
                textCount += 1;
                return `Text ${textCount}: ${element.text.trim() || "(empty)"}`;
            }

            imageCount += 1;
            return `Image ${imageCount}: ${element.imageName ?? "Image"}`;
        });
    }, [elements]);

    /* =====================================================
       UI
    ===================================================== */

    const cardClass = "rounded-xl border border-gray-200 bg-white p-5 shadow-sm";

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            {/* 3D PREVIEW */}

            <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">
                            3D Preview
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Drag elements to position them. Double-click to
                            release.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">
                                Background
                            </span>

                            {BACKGROUNDS.map((item) => (
                                <button
                                    key={item.color}
                                    type="button"
                                    title={item.label}
                                    aria-label={`${item.label} background`}
                                    onClick={() => setBackground(item.color)}
                                    className={`h-6 w-6 rounded-full border transition ${
                                        background === item.color
                                            ? "border-blue-600 ring-2 ring-blue-200"
                                            : "border-gray-300"
                                    }`}
                                    style={{ backgroundColor: item.color }}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="viewSelect"
                                className="text-xs text-gray-600"
                            >
                                Front
                            </label>

                            <select
                                id="viewSelect"
                                value={view}
                                onChange={(event) =>
                                    setView(event.target.value as ViewSide)
                                }
                                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800"
                            >
                                {VIEWS.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => setViewNonce((current) => current + 1)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                            Reset View
                        </button>
                    </div>
                </div>

                <div
                    className="relative h-[480px] w-full sm:h-[600px]"
                    style={{ backgroundColor: background }}
                    onDoubleClick={() => setSelectedId(null)}
                >
                    <Canvas
                        camera={{ position: [0, 1, 6], fov: 40 }}
                        gl={{ antialias: true, alpha: true }}
                    >
                        <color attach="background" args={[background]} />

                        <ambientLight intensity={1.1} />
                        <directionalLight position={[5, 8, 5]} intensity={2} />
                        <directionalLight position={[-5, 3, -5]} intensity={1} />

                        <Suspense fallback={null}>
                            <AwardModel
                                modelUrl={resolvedModelUrl}
                                finish={finish}
                                elements={elements}
                                selectedId={selectedId}
                                view={view}
                                viewNonce={viewNonce}
                                onSelect={setSelectedId}
                                onPlace={handlePlace}
                                onBaseAvailable={setHasBase}
                            />

                            <Environment preset="studio" />
                        </Suspense>

                        <OrbitControls
                            makeDefault
                            enablePan
                            enableZoom
                            enableRotate
                            minDistance={2}
                            maxDistance={10}
                        />
                    </Canvas>

                    <div className="pointer-events-none absolute bottom-4 left-4 rounded-md bg-white/90 px-3 py-2 text-xs text-gray-500 shadow-sm">
                        Drag background to rotate · Drag an element to move it ·
                        Scroll to zoom
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 text-xs text-gray-600">
                    <span>
                        {designArea === "body" ? "Body" : "Base"} customization
                        · {productName}
                    </span>

                    <span>{elements.length} design element(s)</span>
                </div>
            </section>

            {/* RIGHT PANEL */}

            <aside className="flex flex-col gap-5">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Customize Product
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                        Personalize your product design.
                    </p>
                </div>

                {/* DESIGN AREA */}

                <section className={cardClass}>
                    <h3 className="text-sm font-semibold text-gray-900">
                        Design Area
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                        Select the part you want to customize.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        {(["body", "base"] as DesignArea[]).map((area) => {
                            const disabled = area === "base" && !hasBase;

                            return (
                                <button
                                    key={area}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => setDesignArea(area)}
                                    className={`rounded-lg border px-4 py-3 text-sm font-semibold capitalize transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                        designArea === area
                                            ? "border-gray-900 bg-gray-900 text-white"
                                            : "border-gray-300 text-gray-800 hover:bg-gray-50"
                                    }`}
                                >
                                    {area}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ADD ELEMENTS */}

                <section className={cardClass}>
                    <h3 className="text-sm font-semibold text-gray-900">
                        Add Elements
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                        Add text or upload your own image.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={addTextElement}
                            className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                        >
                            T&nbsp; Add Text
                        </button>

                        <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                        >
                            +&nbsp; Add Image
                        </button>

                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>
                </section>

                {/* YOUR ELEMENTS */}

                <section className={cardClass}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">
                            Your Elements
                        </h3>

                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {elements.length}
                        </span>
                    </div>

                    {elements.length === 0 ? (
                        <p className="mt-3 text-xs text-gray-500">
                            Nothing added yet. Use Add Text or Add Image.
                        </p>
                    ) : (
                        <div className="mt-3 flex flex-col gap-2">
                            {elements.map((element, index) => {
                                const selected = element.id === selectedId;

                                return (
                                    <button
                                        key={element.id}
                                        type="button"
                                        onClick={() => setSelectedId(element.id)}
                                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${
                                            selected
                                                ? "border-blue-600 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-400"
                                        }`}
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium text-gray-900">
                                                {elementLabels[index]}
                                            </span>

                                            <span className="block text-xs text-gray-500">
                                                {element.type === "text"
                                                    ? "Text element"
                                                    : "Image element"}{" "}
                                                · {element.area}
                                            </span>
                                        </span>

                                        {selected && (
                                            <span className="ml-2 text-xs font-semibold text-blue-600">
                                                Selected
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ELEMENT SETTINGS */}

                {selectedElement && (
                    <section className={cardClass}>
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Element Settings
                                </h3>

                                <p className="mt-1 text-xs text-gray-500">
                                    Adjust the selected element.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedId(null)}
                                className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                                Release
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            {selectedElement.type === "text" && (
                                <>
                                    <div>
                                        <label
                                            htmlFor="textContent"
                                            className="mb-1.5 block text-xs font-semibold text-gray-700"
                                        >
                                            Text Content
                                        </label>

                                        <textarea
                                            id="textContent"
                                            value={selectedElement.text}
                                            rows={3}
                                            maxLength={180}
                                            onChange={(event) =>
                                                updateElement(selectedElement.id, {
                                                    text: event.target.value,
                                                })
                                            }
                                            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="textColor"
                                            className="mb-1.5 block text-xs font-semibold text-gray-700"
                                        >
                                            Text Color
                                        </label>

                                        <div className="flex items-center gap-3">
                                            <input
                                                id="textColor"
                                                type="color"
                                                value={selectedElement.color}
                                                onChange={(event) =>
                                                    updateElement(
                                                        selectedElement.id,
                                                        { color: event.target.value }
                                                    )
                                                }
                                                className="h-10 w-12 cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
                                            />

                                            <span className="text-sm text-gray-700">
                                                {selectedElement.color}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="fontStyle"
                                            className="mb-1.5 block text-xs font-semibold text-gray-700"
                                        >
                                            Font Style
                                        </label>

                                        <select
                                            id="fontStyle"
                                            value={selectedElement.fontId}
                                            onChange={(event) =>
                                                updateElement(selectedElement.id, {
                                                    fontId: event.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                                        >
                                            {FONT_OPTIONS.map((font) => (
                                                <option key={font.id} value={font.id}>
                                                    {font.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {selectedElement.type === "image" &&
                                selectedElement.imageDataUrl && (
                                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                                        <img
                                            src={selectedElement.imageDataUrl}
                                            alt="Uploaded element preview"
                                            className="h-14 w-14 rounded-md border border-gray-200 object-contain"
                                        />

                                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
                                            {selectedElement.imageName}
                                        </p>
                                    </div>
                                )}

                            <div>
                                <label
                                    htmlFor="elementSize"
                                    className="mb-1.5 flex justify-between text-xs font-semibold text-gray-700"
                                >
                                    <span>Size</span>
                                    <span className="font-normal text-gray-500">
                                        {Math.round(selectedElement.scale * 100)}%
                                    </span>
                                </label>

                                <input
                                    id="elementSize"
                                    type="range"
                                    min={0.1}
                                    max={1}
                                    step={0.01}
                                    value={selectedElement.scale}
                                    onChange={(event) =>
                                        updateElement(selectedElement.id, {
                                            scale: Number(event.target.value),
                                        })
                                    }
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="elementRotation"
                                    className="mb-1.5 flex justify-between text-xs font-semibold text-gray-700"
                                >
                                    <span>Rotation</span>
                                    <span className="font-normal text-gray-500">
                                        {selectedElement.rotation}°
                                    </span>
                                </label>

                                <input
                                    id="elementRotation"
                                    type="range"
                                    min={-180}
                                    max={180}
                                    step={1}
                                    value={selectedElement.rotation}
                                    onChange={(event) =>
                                        updateElement(selectedElement.id, {
                                            rotation: Number(event.target.value),
                                        })
                                    }
                                    className="w-full"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateElement(selectedElement.id, {
                                            placement: null,
                                        })
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                                >
                                    Center on view
                                </button>

                                <button
                                    type="button"
                                    onClick={() => removeElement(selectedElement.id)}
                                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* FINISH */}

                <section className={cardClass}>
                    <h3 className="text-sm font-semibold text-gray-900">
                        Product Finish
                    </h3>

                    <div className="mt-4 grid grid-cols-5 gap-2">
                        {FINISHES.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setFinish(item.id)}
                                title={item.label}
                                className={`flex flex-col items-center gap-2 rounded-lg border p-2 transition ${
                                    finish === item.id
                                        ? "border-blue-600 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-400"
                                }`}
                            >
                                <span
                                    className="h-8 w-8 rounded-full border border-black/10 shadow-sm"
                                    style={{ backgroundColor: item.color }}
                                />

                                <span className="text-[10px] font-medium text-gray-700">
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* SAVE */}

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSaving ? "Saving..." : "Save Customization"}
                </button>
            </aside>
        </div>
    );
}