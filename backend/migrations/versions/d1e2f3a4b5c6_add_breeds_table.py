"""Añadir tabla breeds con razas de perro

Revision ID: d1e2f3a4b5c6
Revises: c3d4e5f6a7b8
Create Date: 2026-06-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'd1e2f3a4b5c6'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None

RAZAS = [
    (1, 'Labrador Retriever'), (2, 'German Shepherd'), (3, 'Golden Retriever'),
    (4, 'French Bulldog'), (5, 'Bulldog'), (6, 'Poodle'), (7, 'Beagle'),
    (8, 'Rottweiler'), (9, 'German Shorthaired Pointer'), (10, 'Dachshund'),
    (11, 'Yorkshire Terrier'), (12, 'Boxer'), (13, 'Siberian Husky'),
    (14, 'Doberman Pinscher'), (15, 'Great Dane'), (16, 'Shih Tzu'),
    (17, 'Miniature Schnauzer'), (18, 'Cavalier King Charles Spaniel'),
    (19, 'Pembroke Welsh Corgi'), (20, 'Australian Shepherd'), (21, 'Chihuahua'),
    (22, 'Boston Terrier'), (23, 'Pomeranian'), (24, 'Havanese'),
    (25, 'Shetland Sheepdog'), (26, 'Brittany'), (27, 'English Springer Spaniel'),
    (28, 'Cocker Spaniel'), (29, 'Border Collie'), (30, 'Bernese Mountain Dog'),
    (31, 'Mastiff'), (32, 'Basset Hound'), (33, 'Weimaraner'), (34, 'Maltese'),
    (35, 'Collie'), (36, 'Vizsla'), (37, 'Newfoundland'), (38, 'Rhodesian Ridgeback'),
    (39, 'West Highland White Terrier'), (40, 'Shiba Inu'), (41, 'Belgian Malinois'),
    (42, 'Papillon'), (43, 'Akita'), (44, 'Lhasa Apso'), (45, 'Bull Terrier'),
    (46, 'Alaskan Malamute'), (47, 'Basenji'), (48, 'Chinese Shar-Pei'),
    (49, 'Irish Setter'), (50, 'Saint Bernard'), (51, 'Afghan Hound'),
    (52, 'Airedale Terrier'), (53, 'American Eskimo Dog'),
    (54, 'American Staffordshire Terrier'), (55, 'Chow Chow'), (56, 'Dalmatian'),
    (57, 'Fox Terrier'), (58, 'Greyhound'), (59, 'Whippet'),
    (60, 'Italian Greyhound'), (61, 'Scottish Terrier'), (62, 'Norfolk Terrier'),
    (63, 'Norwich Terrier'), (64, 'Samoyed'), (65, 'Tibetan Terrier'),
    (66, 'English Bulldog'), (67, 'Toy Poodle'), (68, 'Standard Poodle'),
    (69, 'Miniature Pinscher'), (70, 'Brussels Griffon'), (71, 'Cane Corso'),
    (72, 'Great Pyrenees'), (73, 'Irish Wolfhound'), (74, 'Komondor'),
    (75, 'Kuvasz'), (76, 'Leonberger'), (77, 'Neapolitan Mastiff'),
    (78, 'Old English Sheepdog'), (79, 'Pekingese'), (80, 'Pointer'),
    (81, 'Saluki'), (82, 'Schipperke'), (83, 'Staffordshire Bull Terrier'),
    (84, 'Tibetan Spaniel'), (85, 'Borzois'), (86, 'Bearded Collie'),
    (87, 'Belgian Sheepdog'), (88, 'Bichon Frise'), (89, 'Black Russian Terrier'),
    (90, 'Bluetick Coonhound'), (91, 'Boerboel'), (92, 'Bolognese'),
    (93, 'Boykin Spaniel'), (94, 'Clumber Spaniel'), (95, 'Curly-Coated Retriever'),
    (96, 'English Coonhound'), (97, 'Entlebucher Mountain Dog'),
    (98, 'Field Spaniel'), (99, 'Finnish Spitz'), (100, 'Glen of Imaal Terrier'),
    (101, 'Ibizan Hound'), (102, 'Icelandic Sheepdog'), (103, 'Irish Terrier'),
    (104, 'Japanese Chin'), (105, 'Keeshond'), (106, 'Kerry Blue Terrier'),
    (107, 'Lagotto Romagnolo'), (108, 'Lakeland Terrier'), (109, 'Lowchen'),
    (110, 'Manchester Terrier'), (111, 'Mudi'), (112, 'Otterhound'),
    (113, 'Parson Russell Terrier'), (114, 'Petit Basset Griffon Vendéen'),
    (115, 'Pharaoh Hound'), (116, 'Plott Hound'), (117, 'Polish Lowland Sheepdog'),
    (118, 'Puli'), (119, 'Pyrenean Shepherd'), (120, 'Redbone Coonhound'),
]


def upgrade():
    breeds_table = op.create_table(
        'breeds',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nombre'),
    )
    op.bulk_insert(breeds_table, [{'id': id_, 'nombre': nombre} for id_, nombre in RAZAS])


def downgrade():
    op.drop_table('breeds')
