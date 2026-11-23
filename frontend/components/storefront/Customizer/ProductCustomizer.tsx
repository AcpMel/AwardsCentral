
"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, RefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
    Environment,
    OrbitControls,
    Text,
    useGLTF,
} from "@react-three/drei";
import * as THREE from "three";

/* =========================================================
   TYPES
========================================================= */

export type FrontDirection = "+X" | "-X";

type AwardType = "medal" | "plaque" | "trophy" | "other";

interface PositioningConfig {
    horizontalLimit: number;
    verticalMin: number;
    verticalMax: number;
    defaultY: number;
}

export interface DesignElement {
    id: string;
    type: "text" | "image";
    text: string;
    image: string | null;
    x: number;
    y: number;
    size: number;
    rotation: number;
    color: string;
    fontFamily: string;
}

export interface AreaDesign {
    elements: DesignElement[];
}

export interface ProductCustomization {
    product_id: number;
    front_direction: FrontDirection;
    background_color: string;
    body: AreaDesign;
}

interface Product {
    id: number;
    product_name: string;
    product_type?: string;
    product_glb: string | null;
    is_customizable?: boolean;
}

interface ProductCustomizerProps {
    product: Product;
    onSave?: (customization: ProductCustomization) => void;
}

/* =========================================================
   CONSTANTS
========================================================= */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const MIN_ELEMENT_SIZE = 0.04;
const MAX_ELEMENT_SIZE = 0.35;

const BODY_SURFACE_PADDING = 0.94;

/*
 * Each award type has its own positioning configuration.
 *
 * Positive Y = upper portion of the design surface.
 * Negative Y = lower portion of the design surface.
 */

const POSITIONING_CONFIGS: Record<AwardType, PositioningConfig> = {
    medal: {
        horizontalLimit: 0.47,
        verticalMin: 0.5,
        verticalMax: 1.3,
        defaultY: 0.9,
    },

    plaque: {
        horizontalLimit: 0.40,
        verticalMin: 0.10,
        verticalMax: 1.0,
        defaultY: 0.40,
    },

    trophy: {
        horizontalLimit: 0.35,
        verticalMin: 0.10,
        verticalMax: 0.80,
        defaultY: 0.40,
    },

    other: {
        horizontalLimit: 0.47,
        verticalMin: 0.10,
        verticalMax: 1.00,
        defaultY: 0.50,
    },
};

const FRONT_DIRECTIONS: {
    value: FrontDirection;
    label: string;
}[] = [
    { value: "+X", label: "X+ Front" },
    { value: "-X", label: "X- Front" },
];

const BACKGROUND_OPTIONS = [
    { value: "warm", label: "Warm", color: "#f3e7d7" },
    { value: "studio", label: "Studio", color: "#dfe5ec" },
    { value: "neon", label: "Neon", color: "#171329" },
    { value: "white", label: "White", color: "#ffffff" },
] as const;

type BackgroundPreset =
    (typeof BACKGROUND_OPTIONS)[number]["value"];

const FONT_OPTIONS = [
    { value: "default", label: "Default", url: null },
    {
        value: "dancing-script",
        label: "Dancing Script",
        url: "/fonts/DancingScript.ttf",
    },
    {
        value: "great-vibes",
        label: "Great Vibes",
        url: "/fonts/GreatVibes-Regular.ttf",
    },
    {
        value: "pacifico",
        label: "Pacifico",
        url: "/fonts/Pacifico-Regular.ttf",
    },
    {
        value: "caveat",
        label: "Caveat",
        url: "/fonts/Caveat.ttf",
    },
    {
        value: "satisfy",
        label: "Satisfy",
        url: "/fonts/Satisfy-Regular.ttf",
    },
];

/* =========================================================
   AWARD TYPE DETECTION
========================================================= */

function detectAwardType(product: Product): AwardType {
    const productType = (product.product_type ?? "").toLowerCase();
    const productName = (product.product_name ?? "").toLowerCase();

    const productInfo = `${productType} ${productName}`;

    if (
        productInfo.includes("medal") ||
        productInfo.includes("medallion")
    ) {
        return "medal";
    }

    if (
        productInfo.includes("plaque") ||
        productInfo.includes("wall plate") ||
        productInfo.includes("recognition plate")
    ) {
        return "plaque";
    }

    if (
        productInfo.includes("trophy") ||
        productInfo.includes("cup award") ||
        productInfo.includes("champion cup")
    ) {
        return "trophy";
    }

    return "other";
}

/* =========================================================
   HELPERS
========================================================= */

function createEmptyArea(): AreaDesign {
    return {
        elements: [],
    };
}

function createEmptyElement(
    type: "text" | "image",
    positioning: PositioningConfig
): DesignElement {
    return {
        id: crypto.randomUUID(),
        type,
        text: type === "text" ? "Your Text" : "",
        image: null,
        x: 0,
        y: positioning.defaultY,
        size: 0.12,
        rotation: 0,
        color: "#111111",
        fontFamily: "default",
    };
}

function getModelUrl(path: string | null): string | null {
    if (!path) return null;

    if (
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {
        return path;
    }

    const apiOrigin = API_URL
        ? new URL(API_URL).origin
        : "http://127.0.0.1:8000";

    return `${apiOrigin}${path.startsWith("/") ? "" : "/"}${path}`;
}

/*
 * Calculates the front design surface from the selected
 * BODY mesh bounds only.
 *
 * X+ = positive X side.
 * X- = negative X side.
 */

function getFaceTransform(
    direction: FrontDirection,
    bounds: THREE.Box3
) {
    const min = bounds.min;
    const max = bounds.max;

    const width = max.z - min.z;
    const height = max.y - min.y;
    const depth = max.x - min.x;

    const centerY = (min.y + max.y) / 2;
    const centerZ = (min.z + max.z) / 2;

    const offset = Math.max(depth * 0.002, 0.001);

    if (direction === "+X") {
        return {
            position: [
                max.x + offset,
                centerY,
                centerZ,
            ] as [number, number, number],

            rotation: [
                0,
                Math.PI / 2,
                0,
            ] as [number, number, number],

            width,
            height,
        };
    }

    return {
        position: [
            min.x - offset,
            centerY,
            centerZ,
        ] as [number, number, number],

        rotation: [
            0,
            -Math.PI / 2,
            0,
        ] as [number, number, number],

        width,
        height,
    };
}

/* =========================================================
   CAMERA CONTROLLER
========================================================= */

function CameraFrontController({
    direction,
}: {
    direction: FrontDirection;
}) {
    const { camera } = useThree();

    useEffect(() => {
        camera.position.set(
            direction === "+X" ? 7.5 : -7.5,
            0,
            0
        );

        camera.up.set(0, 1, 0);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }, [camera, direction]);

    return null;
}

/* =========================================================
   FACE POSITIONING
========================================================= */

function getFaceLocalPoint(
    ray: THREE.Ray,
    faceGroup: THREE.Group
): THREE.Vector3 | null {
    faceGroup.updateWorldMatrix(true, false);

    const worldPosition = new THREE.Vector3();
    faceGroup.getWorldPosition(worldPosition);

    const normal = new THREE.Vector3(0, 0, 1)
        .applyQuaternion(
            faceGroup.getWorldQuaternion(
                new THREE.Quaternion()
            )
        )
        .normalize();

    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        normal,
        worldPosition
    );

    const intersection = new THREE.Vector3();

    if (!ray.intersectPlane(plane, intersection)) {
        return null;
    }

    return faceGroup.worldToLocal(intersection.clone());
}

/* =========================================================
   IMAGE ELEMENT
========================================================= */

function ImageElement({
    element,
    areaHeight,
}: {
    element: DesignElement;
    areaHeight: number;
}) {
    const texture = useMemo(() => {
        if (!element.image) return null;

        const loader = new THREE.TextureLoader();
        const loadedTexture = loader.load(element.image);

        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.anisotropy = 8;

        return loadedTexture;
    }, [element.image]);

    useEffect(() => {
        return () => {
            texture?.dispose();
        };
    }, [texture]);

    if (!texture) return null;

    const size = element.size * areaHeight;

    return (
        <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[size, size]} />

            <meshBasicMaterial
                map={texture}
                transparent
                side={THREE.DoubleSide}
                depthTest={false}
                toneMapped={false}
            />
        </mesh>
    );
}

/* =========================================================
   DRAGGABLE ELEMENT
========================================================= */

interface DraggableElementProps {
    element: DesignElement;
    areaWidth: number;
    areaHeight: number;
    positioning: PositioningConfig;
    faceGroupRef: RefObject<THREE.Group | null>;
    selected: boolean;
    onSelect: () => void;
    onUpdate: (
        id: string,
        changes: Partial<DesignElement>
    ) => void;
    setIsDragging: (value: boolean) => void;
}

function DraggableElement({
    element,
    areaWidth,
    areaHeight,
    positioning,
    faceGroupRef,
    selected,
    onSelect,
    onUpdate,
    setIsDragging,
}: DraggableElementProps) {
    const { camera, raycaster, gl } = useThree();

    const dragOffset = useRef(new THREE.Vector3());
    const isDragging = useRef(false);

    const positionX = element.x * areaWidth;
    const positionY = element.y * areaHeight;

    const elementSize = element.size * areaHeight;

    const getPointerLocalPoint = (
        event: ThreeEvent<PointerEvent>
    ) => {
        const faceGroup = faceGroupRef.current;

        if (!faceGroup) return null;

        const rect = gl.domElement.getBoundingClientRect();

        const pointer = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        raycaster.setFromCamera(pointer, camera);

        return getFaceLocalPoint(
            raycaster.ray,
            faceGroup
        );
    };

    const handlePointerDown = (
        event: ThreeEvent<PointerEvent>
    ) => {
        event.stopPropagation();

        onSelect();

        const localPoint = getPointerLocalPoint(event);

        if (!localPoint) return;

        dragOffset.current.set(
            localPoint.x - positionX,
            localPoint.y - positionY,
            0
        );

        isDragging.current = true;

        setIsDragging(true);

        gl.domElement.style.cursor = "grabbing";

        try {
            event.target.setPointerCapture(event.pointerId);
        } catch {
            // Ignore unsupported pointer capture.
        }
    };

    const handlePointerMove = (
        event: ThreeEvent<PointerEvent>
    ) => {
        if (!isDragging.current) return;

        event.stopPropagation();

        const localPoint = getPointerLocalPoint(event);

        if (!localPoint) return;

        const nextX =
            (localPoint.x - dragOffset.current.x) /
            areaWidth;

        const nextY =
            (localPoint.y - dragOffset.current.y) /
            areaHeight;

        onUpdate(element.id, {
            x: THREE.MathUtils.clamp(
                nextX,
                -positioning.horizontalLimit,
                positioning.horizontalLimit
            ),

            y: THREE.MathUtils.clamp(
                nextY,
                positioning.verticalMin,
                positioning.verticalMax
            ),
        });
    };

    const handlePointerUp = (
        event: ThreeEvent<PointerEvent>
    ) => {
        if (!isDragging.current) return;

        event.stopPropagation();

        isDragging.current = false;

        setIsDragging(false);

        gl.domElement.style.cursor = "auto";

        try {
            if (event.target.hasPointerCapture(event.pointerId)) {
                event.target.releasePointerCapture(event.pointerId);
            }
        } catch {
            // Ignore unsupported pointer capture.
        }
    };

    const fontUrl =
        FONT_OPTIONS.find(
            (font) => font.value === element.fontFamily
        )?.url ?? undefined;

    return (
        <group position={[positionX, positionY, 0.001]}>
            {/* Invisible drag and selection hitbox */}

            <mesh
                position={[0, 0, 0.02]}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <planeGeometry
                    args={[
                        Math.max(elementSize * 1.5, 0.2),
                        Math.max(elementSize * 1.5, 0.2),
                    ]}
                />

                <meshBasicMaterial
                    transparent
                    opacity={0}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Actual element */}

            <group
                rotation={[
                    0,
                    0,
                    THREE.MathUtils.degToRad(element.rotation),
                ]}
            >
                {element.type === "text" ? (
                    <Text
                        font={fontUrl}
                        fontSize={elementSize}
                        color={element.color}
                        anchorX="center"
                        anchorY="middle"
                        textAlign="center"
                        maxWidth={areaWidth * 0.85}
                        outlineWidth={selected ? 0.003 : 0}
                        outlineColor="#2563eb"
                        depthOffset={-1}
                    >
                        {element.text}

                        {/* Make text visible from both sides */}
                        <meshBasicMaterial
                            side={THREE.DoubleSide}
                            transparent={false}
                            depthTest={false}
                            toneMapped={false}
                        />
                    </Text>
                ) : (
                    <ImageElement
                        element={element}
                        areaHeight={areaHeight}
                    />
                )}
            </group>

            {/* Selection indicator */}

            {selected && (
                <mesh position={[0, 0, 0.025]}>
                    <ringGeometry
                        args={[
                            elementSize * 0.65,
                            elementSize * 0.7,
                            48,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#2563eb"
                        side={THREE.DoubleSide}
                        depthTest={false}
                    />
                </mesh>
            )}
        </group>
    );
}

/* =========================================================
   BODY DESIGN SURFACE
========================================================= */

interface DesignSurfaceProps {
    design: AreaDesign;
    areaWidth: number;
    areaHeight: number;
    positioning: PositioningConfig;
    faceGroupRef: RefObject<THREE.Group | null>;
    selectedElementId: string | null;
    onSelectElement: (id: string) => void;
    onUpdateElement: (
        id: string,
        changes: Partial<DesignElement>
    ) => void;
    setIsDragging: (value: boolean) => void;
}

function DesignSurface({
    design,
    areaWidth,
    areaHeight,
    positioning,
    faceGroupRef,
    selectedElementId,
    onSelectElement,
    onUpdateElement,
    setIsDragging,
}: DesignSurfaceProps) {
    return (
        <group>
            {design.elements.map((element) => (
                <DraggableElement
                    key={element.id}
                    element={element}
                    areaWidth={areaWidth}
                    areaHeight={areaHeight}
                    positioning={positioning}
                    faceGroupRef={faceGroupRef}
                    selected={selectedElementId === element.id}
                    onSelect={() => onSelectElement(element.id)}
                    onUpdate={onUpdateElement}
                    setIsDragging={setIsDragging}
                />
            ))}
        </group>
    );
}

/* =========================================================
   BODY MESH DETECTION
========================================================= */

function findBodyBounds(
    clonedScene: THREE.Group,
    originalBounds: THREE.Box3
): THREE.Box3 {
    const modelSize = new THREE.Vector3();
    originalBounds.getSize(modelSize);

    const modelHeight = Math.max(modelSize.y, 0.0001);
    const modelBottom = originalBounds.min.y;

    const candidates: {
        mesh: THREE.Mesh;
        bounds: THREE.Box3;
        width: number;
        height: number;
        depth: number;
        score: number;
        centerRatio: number;
        heightRatio: number;
        topRatio: number;
        name: string;
    }[] = [];

    const baseNamePattern =
        /base|stand|pedestal|foot|bottom|support|platform|plinth/i;

    const bodyNamePattern =
        /body|medal|trophy|cup|main|front|shell|head|prism|product/i;

    clonedScene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) {
            return;
        }

        if (!object.visible) {
            return;
        }

        const meshBounds = new THREE.Box3().setFromObject(object);

        if (meshBounds.isEmpty()) {
            return;
        }

        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        meshBounds.getSize(size);
        meshBounds.getCenter(center);

        const width = size.z;
        const height = size.y;
        const depth = size.x;

        if (
            width <= 0.0001 ||
            height <= 0.0001 ||
            depth <= 0.0001
        ) {
            return;
        }

        const heightRatio = height / modelHeight;

        const centerRatio = THREE.MathUtils.clamp(
            (center.y - modelBottom) / modelHeight,
            0,
            1
        );

        const topRatio = THREE.MathUtils.clamp(
            (meshBounds.max.y - modelBottom) / modelHeight,
            0,
            1
        );

        const projectedArea = width * height;

        const meshName = object.name || "";

        const isBaseLike = baseNamePattern.test(meshName);
        const isBodyLike = bodyNamePattern.test(meshName);

        const heightWeight = 0.35 + heightRatio * 2;
        const verticalWeight = 0.35 + centerRatio;
        const topWeight = 0.5 + topRatio;

        let score =
            projectedArea *
            heightWeight *
            verticalWeight *
            topWeight;

        if (isBodyLike) {
            score *= 1.5;
        }

        if (isBaseLike) {
            score *= 0.12;
        }

        candidates.push({
            mesh: object,
            bounds: meshBounds.clone(),
            width,
            height,
            depth,
            score,
            centerRatio,
            heightRatio,
            topRatio,
            name: meshName,
        });
    });

    if (candidates.length === 0) {
        console.warn(
            "Product customizer: no separate body mesh found. Using complete model bounds."
        );

        return originalBounds.clone();
    }

    const bodyCandidates = candidates.filter((candidate) => {
        const isBaseLike = baseNamePattern.test(candidate.name);

        return (
            !isBaseLike &&
            candidate.topRatio > 0.35 &&
            candidate.heightRatio > 0.12
        );
    });

    const availableCandidates =
        bodyCandidates.length > 0
            ? bodyCandidates
            : candidates;

    availableCandidates.sort(
        (a, b) => b.score - a.score
    );

    const selectedBody = availableCandidates[0];

    console.log("Product body mesh analysis:", {
        selectedBody: selectedBody.name,

        bodyBounds: {
            min: selectedBody.bounds.min.toArray(),
            max: selectedBody.bounds.max.toArray(),
        },

        bodyDimensions: {
            width: selectedBody.width,
            height: selectedBody.height,
            depth: selectedBody.depth,
        },

        candidates: candidates.map((candidate) => ({
            name: candidate.name,
            width: candidate.width,
            height: candidate.height,
            depth: candidate.depth,
            centerRatio: candidate.centerRatio,
            heightRatio: candidate.heightRatio,
            topRatio: candidate.topRatio,
            score: candidate.score,
        })),
    });

    return selectedBody.bounds.clone();
}

/* =========================================================
   PRODUCT MODEL
========================================================= */

interface ProductModelProps {
    modelUrl: string;
    frontDirection: FrontDirection;
    body: AreaDesign;
    positioning: PositioningConfig;
    selectedElementId: string | null;
    onSelectElement: (id: string) => void;
    onUpdateElement: (
        id: string,
        changes: Partial<DesignElement>
    ) => void;
    setIsDragging: (value: boolean) => void;
}

function ProductModel({
    modelUrl,
    frontDirection,
    body,
    positioning,
    selectedElementId,
    onSelectElement,
    onUpdateElement,
    setIsDragging,
}: ProductModelProps) {
    const { scene } = useGLTF(modelUrl);

    const faceGroupRef = useRef<THREE.Group>(null);

    const modelData = useMemo(() => {
        const clonedScene = scene.clone(true);

        clonedScene.updateMatrixWorld(true);

        const originalBounds = new THREE.Box3().setFromObject(
            clonedScene
        );

        const center = new THREE.Vector3();

        originalBounds.getCenter(center);

        const bodyBounds = findBodyBounds(
            clonedScene,
            originalBounds
        );

        return {
            clonedScene,
            originalBounds,
            center,
            bodyBounds,
        };
    }, [scene]);

    const face = useMemo(
        () =>
            getFaceTransform(
                frontDirection,
                modelData.bodyBounds
            ),
        [frontDirection, modelData]
    );

    const centeredFacePosition: [
        number,
        number,
        number
    ] = [
        face.position[0] - modelData.center.x,
        face.position[1] - modelData.center.y,
        face.position[2] - modelData.center.z,
    ];

    const bodyWidth = Math.max(
        face.width * BODY_SURFACE_PADDING,
        0.001
    );

    const bodyHeight = Math.max(
        face.height * BODY_SURFACE_PADDING,
        0.001
    );

    return (
        <group
            position={[
                -modelData.center.x,
                -modelData.center.y,
                -modelData.center.z,
            ]}
        >
            <primitive object={modelData.clonedScene} />

            <group
                ref={faceGroupRef}
                position={centeredFacePosition}
                rotation={face.rotation}
            >
                <DesignSurface
                    design={body}
                    areaWidth={bodyWidth}
                    areaHeight={bodyHeight}
                    positioning={positioning}
                    faceGroupRef={faceGroupRef}
                    selectedElementId={selectedElementId}
                    onSelectElement={onSelectElement}
                    onUpdateElement={onUpdateElement}
                    setIsDragging={setIsDragging}
                />
            </group>
        </group>
    );
}

/* =========================================================
   MAIN PRODUCT CUSTOMIZER
========================================================= */

export default function ProductCustomizer({
    product,
    onSave,
}: ProductCustomizerProps) {
    const [frontDirection, setFrontDirection] =
        useState<FrontDirection>("+X");

    const [body, setBody] = useState<AreaDesign>(
        createEmptyArea()
    );

    const [selectedElementId, setSelectedElementId] =
        useState<string | null>(null);

    const [isDragging, setIsDragging] = useState(false);

    const [backgroundPreset, setBackgroundPreset] =
        useState<BackgroundPreset>("studio");

    /*
     * Detect the selected product's award type.
     * The resulting configuration is used throughout
     * dragging, sliders, and automatic placement.
     */

    const awardType = useMemo(
        () => detectAwardType(product),
        [product.product_type, product.product_name]
    );

    const positioning = POSITIONING_CONFIGS[awardType];

    const modelUrl = useMemo(
        () => getModelUrl(product.product_glb),
        [product.product_glb]
    );

    const selectedBackground =
        BACKGROUND_OPTIONS.find(
            (option) => option.value === backgroundPreset
        ) ?? BACKGROUND_OPTIONS[1];

    const selectedElement =
        body.elements.find(
            (element) => element.id === selectedElementId
        ) ?? null;

    useEffect(() => {
        setFrontDirection("+X");
        setBody(createEmptyArea());
        setSelectedElementId(null);
        setBackgroundPreset("studio");
    }, [product.id]);

    /* =====================================================
       ELEMENT OPERATIONS
    ===================================================== */

    const addElement = (
        type: "text" | "image"
    ) => {
        const newElement = createEmptyElement(
            type,
            positioning
        );

        setBody((previous) => ({
            ...previous,
            elements: [
                ...previous.elements,
                newElement,
            ],
        }));

        setSelectedElementId(newElement.id);
    };

    const updateElement = (
        id: string,
        changes: Partial<DesignElement>
    ) => {
        setBody((previous) => ({
            ...previous,
            elements: previous.elements.map((element) =>
                element.id === id
                    ? { ...element, ...changes }
                    : element
            ),
        }));
    };

    const updateSelectedElement = (
        changes: Partial<DesignElement>
    ) => {
        if (!selectedElementId) return;

        updateElement(selectedElementId, changes);
    };

    const deleteElement = () => {
        if (!selectedElementId) return;

        setBody((previous) => ({
            ...previous,
            elements: previous.elements.filter(
                (element) => element.id !== selectedElementId
            ),
        }));

        setSelectedElementId(null);
    };

    /* =====================================================
       IMAGE UPLOAD
    ===================================================== */

    const handleImageUpload = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            alert("Please upload a PNG, JPG, or WEBP image.");
            event.target.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const imageData = reader.result;

            if (typeof imageData !== "string") return;

            const newElement = createEmptyElement(
                "image",
                positioning
            );

            newElement.image = imageData;

            setBody((previous) => ({
                ...previous,
                elements: [
                    ...previous.elements,
                    newElement,
                ],
            }));

            setSelectedElementId(newElement.id);
        };

        reader.readAsDataURL(file);

        event.target.value = "";
    };

    /* =====================================================
       SAVE CUSTOMIZATION
    ===================================================== */

    const handleSave = () => {
        const customization: ProductCustomization = {
            product_id: product.id,
            front_direction: frontDirection,
            background_color: selectedBackground.color,
            body,
        };

        onSave?.(customization);
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 xl:mt-0 xl:ml-6">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">

                {/* LEFT: 3D PREVIEW */}

                <div className="min-w-0">
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 p-4">
                            <div>
                                <h2 className="text-base font-semibold tracking-tight text-gray-950">
                                    3D Preview
                                </h2>

                                <p className="mt-1 text-xs text-gray-600">
                                    Drag elements across the available body design area. Use Release to deselect.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">

                                {/* BACKGROUND */}

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-700">
                                        Background
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        {BACKGROUND_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                title={option.label}
                                                aria-label={`${option.label} background`}
                                                onClick={() =>
                                                    setBackgroundPreset(option.value)
                                                }
                                                className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                                                    backgroundPreset === option.value
                                                        ? "border-blue-600 ring-2 ring-blue-100"
                                                        : "border-gray-300 hover:border-gray-500"
                                                }`}
                                            >
                                                <span
                                                    className="h-5 w-5 rounded-full border border-black/10"
                                                    style={{
                                                        backgroundColor: option.color,
                                                    }}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <span className="text-xs text-gray-600">
                                        {selectedBackground.label}
                                    </span>
                                </div>

                                {/* FRONT DIRECTION */}

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-700">
                                        Front
                                    </span>

                                    <select
                                        id="front-direction"
                                        value={frontDirection}
                                        onChange={(event) => {
                                            setFrontDirection(
                                                event.target.value as FrontDirection
                                            );

                                            setSelectedElementId(null);
                                        }}
                                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 outline-none focus:border-blue-500"
                                    >
                                        {FRONT_DIRECTIONS.map((direction) => (
                                            <option
                                                key={direction.value}
                                                value={direction.value}
                                            >
                                                {direction.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* CANVAS */}

                        <div className="h-[520px] w-full">
                            {modelUrl ? (
                                <Canvas
                                    camera={{
                                        position: [7.5, 0, 0],
                                        fov: 45,
                                        near: 0.01,
                                        far: 1000,
                                    }}
                                >
                                    <color
                                        attach="background"
                                        args={[selectedBackground.color]}
                                    />

                                    <ambientLight intensity={1.2} />

                                    <directionalLight
                                        position={[4, 5, 5]}
                                        intensity={2}
                                    />

                                    <directionalLight
                                        position={[-4, 2, -5]}
                                        intensity={1}
                                    />

                                    <Suspense fallback={null}>
                                        <CameraFrontController
                                            direction={frontDirection}
                                        />

                                        <ProductModel
                                            modelUrl={modelUrl}
                                            frontDirection={frontDirection}
                                            body={body}
                                            positioning={positioning}
                                            selectedElementId={selectedElementId}
                                            onSelectElement={(id) => {
                                                setSelectedElementId(id);
                                            }}
                                            onUpdateElement={updateElement}
                                            setIsDragging={setIsDragging}
                                        />

                                        <Environment preset="studio" />
                                    </Suspense>

                                    <OrbitControls
                                        enabled={!isDragging}
                                        enableDamping
                                        dampingFactor={0.08}
                                        target={[0, 0, 0]}
                                    />
                                </Canvas>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center bg-gray-50 px-6 text-center">
                                    <p className="text-sm font-semibold text-gray-800">
                                        No 3D model available
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                        This product does not have a GLB model assigned.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                            <span className="text-xs text-gray-600">
                                Body customization
                            </span>

                            <span className="text-xs font-medium text-gray-700">
                                {body.elements.length} design element(s)
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: CUSTOMIZATION PANEL */}

                <div className="min-w-0 space-y-4">

                    <div className="px-1">
                        <h2 className="text-lg font-semibold tracking-tight text-gray-800">
                            Customize Product
                        </h2>

                        <p className="mt-1 text-sm text-gray-600">
                            Personalize the body of your product.
                        </p>

                        <p className="mt-2 text-xs font-medium text-blue-700">
                            Detected award type: {awardType.toUpperCase()}
                        </p>
                    </div>

                    {/* DESIGN AREA */}

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-950">
                                Design Area
                            </h3>

                            <p className="mt-1 text-xs text-gray-600">
                                Elements can only be added to the product body.
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                            <span className="text-sm font-semibold capitalize text-gray-800">
                                Body
                            </span>
                        </div>
                    </div>

                    {/* ADD ELEMENTS */}

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-950">
                            Add Elements
                        </h3>

                        <p className="mt-1 text-xs text-gray-600">
                            Add text or upload your own image.
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => addElement("text")}
                                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                            >
                                <span className="text-lg leading-none">T</span>
                                Add Text
                            </button>

                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-800">
                                <span className="text-lg leading-none">+</span>
                                Add Image

                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* ELEMENT LIST */}

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-950">
                                Your Elements
                            </h3>

                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                {body.elements.length}
                            </span>
                        </div>

                        {body.elements.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
                                <p className="text-sm font-medium text-gray-800">
                                    No elements yet
                                </p>

                                <p className="mt-1 text-xs text-gray-600">
                                    Add text or an image to start designing.
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-48 space-y-2 overflow-y-auto">
                                {body.elements.map((element, index) => (
                                    <button
                                        type="button"
                                        key={element.id}
                                        onClick={() =>
                                            setSelectedElementId(element.id)
                                        }
                                        className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                                            selectedElementId === element.id
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 bg-white hover:bg-gray-50"
                                        }`}
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium text-gray-900">
                                                {element.type === "text"
                                                    ? `Text ${index + 1}: ${element.text || "Untitled"}`
                                                    : `Image ${index + 1}`}
                                            </span>

                                            <span className="mt-0.5 block text-xs text-gray-600">
                                                {element.type === "text"
                                                    ? "Text element"
                                                    : "Image element"}
                                            </span>
                                        </span>

                                        <span
                                            className={`shrink-0 text-xs font-semibold ${
                                                selectedElementId === element.id
                                                    ? "text-blue-700"
                                                    : "text-gray-600"
                                            }`}
                                        >
                                            {selectedElementId === element.id
                                                ? "Selected"
                                                : "Edit"}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ELEMENT SETTINGS */}

                    {selectedElement && (
                        <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-950">
                                        Element Settings
                                    </h3>

                                    <p className="mt-1 text-xs text-gray-600">
                                        Adjust the selected element.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedElementId(null)}
                                    className="rounded-md px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                >
                                    Release
                                </button>
                            </div>

                            <div className="space-y-4">

                                {/* TEXT SETTINGS */}

                                {selectedElement.type === "text" && (
                                    <>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                Text Content
                                            </label>

                                            <textarea
                                                value={selectedElement.text}
                                                onChange={(event) =>
                                                    updateSelectedElement({
                                                        text: event.target.value,
                                                    })
                                                }
                                                rows={3}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                                                placeholder="Enter your text"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                Text Color
                                            </label>

                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={selectedElement.color}
                                                    onChange={(event) =>
                                                        updateSelectedElement({
                                                            color: event.target.value,
                                                        })
                                                    }
                                                    className="h-10 w-12 cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
                                                />

                                                <span className="text-sm font-medium uppercase text-gray-700">
                                                    {selectedElement.color}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                Font Style
                                            </label>

                                            <select
                                                value={selectedElement.fontFamily}
                                                onChange={(event) =>
                                                    updateSelectedElement({
                                                        fontFamily: event.target.value,
                                                    })
                                                }
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500"
                                            >
                                                {FONT_OPTIONS.map((font) => (
                                                    <option
                                                        key={font.value}
                                                        value={font.value}
                                                    >
                                                        {font.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* SIZE */}

                                <div className="border-t border-gray-100 pt-4">
                                    <div>
                                        <div className="mb-2 flex justify-between">
                                            <label className="text-xs font-semibold text-gray-700">
                                                Size
                                            </label>

                                            <span className="text-xs font-medium text-gray-700">
                                                {Math.round(selectedElement.size * 100)}%
                                            </span>
                                        </div>

                                        <input
                                            type="range"
                                            min={MIN_ELEMENT_SIZE}
                                            max={MAX_ELEMENT_SIZE}
                                            step={0.01}
                                            value={selectedElement.size}
                                            onChange={(event) =>
                                                updateSelectedElement({
                                                    size: Number(event.target.value),
                                                })
                                            }
                                            className="w-full accent-gray-900"
                                        />
                                    </div>

                                    {/* ROTATION */}

                                    <div className="mt-4">
                                        <div className="mb-2 flex justify-between">
                                            <label className="text-xs font-semibold text-gray-700">
                                                Rotation
                                            </label>

                                            <span className="text-xs font-medium text-gray-700">
                                                {selectedElement.rotation}°
                                            </span>
                                        </div>

                                        <input
                                            type="range"
                                            min="-180"
                                            max="180"
                                            step="1"
                                            value={selectedElement.rotation}
                                            onChange={(event) =>
                                                updateSelectedElement({
                                                    rotation: Number(event.target.value),
                                                })
                                            }
                                            className="w-full accent-gray-900"
                                        />
                                    </div>
                                </div>

                                {/* POSITION */}

                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="mb-3 text-xs font-semibold text-gray-800">
                                        Position
                                    </h4>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-2 block text-xs text-gray-700">
                                                Horizontal
                                            </label>

                                            <input
                                                type="range"
                                                min={-positioning.horizontalLimit}
                                                max={positioning.horizontalLimit}
                                                step="0.01"
                                                value={selectedElement.x}
                                                onChange={(event) =>
                                                    updateSelectedElement({
                                                        x: Number(event.target.value),
                                                    })
                                                }
                                                className="w-full accent-gray-900"
                                            />

                                            <p className="mt-1 text-xs text-gray-500">
                                                {selectedElement.x.toFixed(2)}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs text-gray-700">
                                                Vertical
                                            </label>

                                            <input
                                                type="range"
                                                min={positioning.verticalMin}
                                                max={positioning.verticalMax}
                                                step="0.01"
                                                value={THREE.MathUtils.clamp(
                                                    selectedElement.y,
                                                    positioning.verticalMin,
                                                    positioning.verticalMax
                                                )}
                                                onChange={(event) =>
                                                    updateSelectedElement({
                                                        y: Number(event.target.value),
                                                    })
                                                }
                                                className="w-full accent-gray-900"
                                            />

                                            <p className="mt-1 text-xs text-gray-500">
                                                {selectedElement.y.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-xs text-gray-500">
                                        {awardType.toUpperCase()} positioning limits: X ±
                                        {positioning.horizontalLimit.toFixed(2)}, Y{" "}
                                        {positioning.verticalMin.toFixed(2)} to{" "}
                                        {positioning.verticalMax.toFixed(2)}
                                    </p>
                                </div>

                                {/* DELETE */}

                                <button
                                    type="button"
                                    onClick={deleteElement}
                                    className="w-full rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                >
                                    Delete Element
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SAVE */}

                    <button
                        type="button"
                        onClick={handleSave}
                        className="w-full rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                        Save Customization
                    </button>

                    <p className="text-center text-xs leading-relaxed text-gray-600">
                        Your body design changes will be included in your customization.
                    </p>
                </div>
            </div>
        </div>
    );
}
