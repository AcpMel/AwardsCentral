
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.products.models import ProductCategory


CATEGORY_TREE = {
    "CRYSTAL AWARDS": {
        "CRYSTAL PLAQUE": {
            "Core Series": [
                "Glass 5 inches - 8mm",
                "Glass 6 inches - 8mm",
                "Glass 7 inches - 8mm",
            ],
            "Aurum Series": [
                "Gold Glass 6 inches",
                "Gold Glass 7 inches",
            ],
            "Sapphire Series": [],
            "Trinity Series": [
                "Zircon",
                "Tanzanite",
                "Peridot",
                "Amethyst",
            ],
            "Iconic Series": [
                "Glass 8 inches - 12mm",
                "Glass 9 inches - 12mm",
                "Glass 10 inches - 12mm",
            ],
            "Obsidian Series": [],
            "Duet Series": [
                "Duet 8 inches",
                "Duet 9 inches",
                "Duet 10 inches",
            ],
            "Trilogy Series": [
                "Helix",
                "Portal",
            ],
            "Illumina Series": [
                "Glass 6inch",
                "Glass 7inch",
                "Glass 8inch",
            ],
        },
        "CRYSTAL TROPHIES": {
            "Prism Series": [],
            "Imperial Series": [],
            "Executive Series": [],
            "Pinnacle Series": [],
            "Prestige Series": [],
            "Zenith Series": [],
            "Sovereign Series": [],
            "Verdant Series": [],
        },
    },

    "ACRYLIC AWARDS": {
        "Lumina Series": [
            "8 inches - Thickness 8mm",
            "Acrylic 7inch",
            "Acrylic 8inch",
        ],
        "Unnamed Acrylic Series": [
            "6 inches",
            "7 inches",
            "8 inches",
            "9 inches",
            "10 inches",
        ],
        "Prime Series - 24mm": [
            "6 inches",
            "8 inches",
            "10 inches",
        ],
        "Elite Series - 40mm": [
            "Design 1",
            "Design 2",
            "Design 3",
            "Design 4",
        ],
        "Apex Series - 50mm": {
            "Design 1 Series": [
                "6 inches",
                "8 inches",
                "10 inches",
            ],
            "Design 2 Series": [
                "6 inches",
                "8 inches",
                "10 inches",
            ],
        },
    },

    "WOOD AWARDS": {
        "Heritage Series": [],
        "Regal Series - 40mm": [],
        "Legacy Series - 50mm": [],
    },

    "METAL AWARDS": {
        "Polymer Series": [],
        "Polymetal": [],
        "Monument Series": [],
    },
}


class Command(BaseCommand):
    help = "Create the Awards Central product category hierarchy."

    def create_category(self, name, parent=None):
        base_slug = slugify(name)
        slug = base_slug
        counter = 1

        while ProductCategory.objects.filter(
            slug=slug
        ).exclude(
            parent=parent
        ).exists():
            counter += 1
            slug = f"{base_slug}-{counter}"

        category, created = ProductCategory.objects.get_or_create(
            parent=parent,
            category_name=name,
            defaults={"slug": slug},
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(f"Created: {name}")
            )

        return category

    def process_tree(self, tree, parent=None):
        for name, children in tree.items():
            category = self.create_category(name, parent)

            if isinstance(children, dict):
                self.process_tree(children, category)

            elif isinstance(children, list):
                for child_name in children:
                    self.create_category(child_name, category)

    def handle(self, *args, **options):
        self.process_tree(CATEGORY_TREE)

        self.stdout.write(
            self.style.SUCCESS(
                "Product category hierarchy successfully populated."
            )
        )
