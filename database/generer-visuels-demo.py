# -*- coding: utf-8 -*-
"""Genere les visuels de demonstration : avatars, photos de vehicules,
images d'equipements. Style plat, lisible en vignette dans un tableau.

Aucune photographie de personne reelle n'est fabriquee : les avatars sont
des monogrammes, ce qui est la convention des back-offices et evite tout
probleme de droit a l'image dans un rapport soutenu.
"""
import os, math
from PIL import Image, ImageDraw, ImageFont

BASE = r'C:\Users\saber\Desktop\Xpark gmao\data\uploads'
POLICES = [
    r'C:\Windows\Fonts\segoeuib.ttf',
    r'C:\Windows\Fonts\arialbd.ttf',
    r'C:\Windows\Fonts\calibrib.ttf',
]


def police(taille):
    for p in POLICES:
        if os.path.exists(p):
            return ImageFont.truetype(p, taille)
    return ImageFont.load_default()


def centrer(d, boite, texte, fnt, couleur):
    x0, y0, x1, y1 = boite
    l, t, r, b = d.textbbox((0, 0), texte, font=fnt)
    d.text((x0 + (x1 - x0 - (r - l)) / 2 - l,
            y0 + (y1 - y0 - (b - t)) / 2 - t), texte, font=fnt, fill=couleur)


# ============================================================ AVATARS
PALETTE = ['#1E88E5', '#00897B', '#5E35B1', '#D81B60', '#F4511E', '#3949AB',
           '#00838F', '#6D4C41', '#7CB342', '#C62828', '#0277BD', '#4527A0']


def avatar(initiales, chemin, index):
    T = 256
    im = Image.new('RGB', (T, T), '#FFFFFF')
    d = ImageDraw.Draw(im)
    fond = PALETTE[index % len(PALETTE)]
    d.ellipse([6, 6, T - 6, T - 6], fill=fond)
    centrer(d, (0, 0, T, T - 8), initiales, police(104), '#FFFFFF')
    im.save(chemin, 'PNG')


# ============================================================ VEHICULES
SILHOUETTES = {
    # (corps, cabine, nb_roues) exprimes en fraction de la largeur
    'CAMION':     [(0.06, 0.30, 0.62, 0.78), (0.62, 0.18, 0.94, 0.78)],
    'UTILITAIRE': [(0.08, 0.34, 0.60, 0.78), (0.60, 0.22, 0.92, 0.78)],
    'VAN':        [(0.08, 0.28, 0.92, 0.78)],
    'MINIBUS':    [(0.06, 0.24, 0.94, 0.78)],
    'BERLINE':    [(0.08, 0.46, 0.92, 0.78), (0.30, 0.28, 0.72, 0.50)],
    'SUV':        [(0.08, 0.40, 0.92, 0.78), (0.26, 0.22, 0.76, 0.44)],
    'AUTRE':      [(0.08, 0.36, 0.92, 0.78)],
}
TEINTE = {'CAMION': ('#37474F', '#455A64'), 'UTILITAIRE': ('#1565C0', '#1976D2'),
          'VAN': ('#00695C', '#00796B'), 'MINIBUS': ('#4527A0', '#512DA8'),
          'BERLINE': ('#616161', '#757575'), 'SUV': ('#33691E', '#558B2F'),
          'AUTRE': ('#5D4037', '#6D4C41')}


def vehicule(marque, modele, plaque, typ, chemin):
    W, H = 640, 400
    im = Image.new('RGB', (W, H), '#ECEFF1')
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 120], fill='#CFD8DC')                 # ciel
    d.rectangle([0, H - 96, W, H], fill='#B0BEC5')              # sol
    d.line([(0, H - 96), (W, H - 96)], fill='#90A4AE', width=3)

    sombre, clair = TEINTE.get(typ, TEINTE['AUTRE'])
    y0, y1 = 120, H - 96
    for i, (a, b, c, e) in enumerate(SILHOUETTES.get(typ, SILHOUETTES['AUTRE'])):
        d.rounded_rectangle([a * W, y0 + b * (y1 - y0), c * W, y0 + e * (y1 - y0)],
                            radius=14, fill=sombre if i == 0 else clair)
    # vitre
    d.rounded_rectangle([0.66 * W, y0 + 0.28 * (y1 - y0),
                         0.90 * W, y0 + 0.48 * (y1 - y0)], radius=8, fill='#B3E5FC')
    # roues
    for cx in (0.22, 0.78):
        r = 34
        d.ellipse([cx * W - r, y1 - r - 6, cx * W + r, y1 + r - 6], fill='#212121')
        d.ellipse([cx * W - 13, y1 - 13 - 6, cx * W + 13, y1 + 13 - 6], fill='#9E9E9E')

    d.rectangle([0, H - 62, W, H], fill='#FFFFFF')
    centrer(d, (0, H - 60, W, H - 34), '%s %s' % (marque, modele), police(24), '#263238')
    centrer(d, (0, H - 34, W, H - 6), plaque, police(20), '#546E7A')
    im.save(chemin, 'JPEG', quality=90)


# ============================================================ EQUIPEMENTS
def equipement(nom, categorie, chemin, index):
    W, H = 520, 400
    fond = PALETTE[(index + 3) % len(PALETTE)]
    im = Image.new('RGB', (W, H), '#FFFFFF')
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, H - 88], fill=fond)

    cx, cy, R = W / 2, (H - 88) / 2, 78
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill='#FFFFFF')
    g = {'Securite': 'S', 'Mecanique': 'M', 'Electronique': 'E',
         'Outillage': 'O', 'Informatique': 'I', 'Autre': 'A'}.get(categorie, 'A')
    centrer(d, (cx - R, cy - R, cx + R, cy + R), g, police(88), fond)

    centrer(d, (0, H - 84, W, H - 46), nom[:34], police(26), '#263238')
    centrer(d, (0, H - 46, W, H - 10), categorie, police(20), '#78909C')
    im.save(chemin, 'JPEG', quality=90)


# ============================================================ DONNEES
AVATARS = [
    ('SB', 'saber-barhoumi'), ('KB', 'karim-benali'), ('MT', 'mohamed-trabelsi'),
    ('IC', 'ines-chaabane'), ('YM', 'yassine-mejri'), ('HZ', 'hatem-zouari'),
    ('NF', 'nadia-ferchichi'), ('OB', 'olfa-bouazizi'), ('SH', 'sami-hamdi'),
    ('RM', 'riadh-maaloul'), ('NG', 'nizar-gharbi'), ('AK', 'anis-khelifi'),
    ('BJ', 'bilel-jendoubi'), ('WC', 'walid-chouchane'), ('FA', 'fethi-amri'),
    ('MS', 'moez-slimani'), ('LB', 'leila-benyoussef'),
    ('TL', 'tahar-lakhdar'), ('SF', 'sonia-fakhfakh'),
    # contacts clients : les initiales sont celles de la PERSONNE affichee
    ('MK', 'mounir-kacem'), ('FY', 'faten-ayari'), ('SZ', 'slim-bouaziz'),
    ('RN', 'rim-nasri'), ('HD', 'hichem-dridi'), ('AR', 'amine-rekik'),
    ('JO', 'jalel-ouertani'), ('DB', 'dorra-belhaj'), ('KS', 'kamel-sassi'),
    ('AG', 'ahlem-gargouri'),
]

VEHICULES = [
    ('Iveco', 'Daily 35C15', '112 TU 4820', 'CAMION', 'iveco-daily'),
    ('Iveco', 'Eurocargo 120E', '118 TU 5133', 'CAMION', 'iveco-eurocargo'),
    ('Mercedes-Benz', 'Sprinter 315 CDI', '124 TU 6041', 'UTILITAIRE', 'mb-sprinter'),
    ('Mercedes-Benz', 'Actros 1845', '131 TU 7290', 'CAMION', 'mb-actros'),
    ('Renault', 'Master L3H2', '137 TU 8115', 'UTILITAIRE', 'renault-master'),
    ('Renault', 'Trafic', '142 TU 2634', 'VAN', 'renault-trafic'),
    ('Renault', 'Kangoo Express', '148 TU 3907', 'UTILITAIRE', 'renault-kangoo'),
    ('Peugeot', 'Partner', '153 TU 1188', 'UTILITAIRE', 'peugeot-partner'),
    ('Peugeot', 'Boxer 335 L3', '159 TU 4472', 'UTILITAIRE', 'peugeot-boxer'),
    ('Volkswagen', 'Transporter T6', '164 TU 5560', 'VAN', 'vw-transporter'),
    ('Volkswagen', 'Crafter 35', '170 TU 6318', 'UTILITAIRE', 'vw-crafter'),
    ('Isuzu', 'N-Series NPR', '176 TU 7745', 'CAMION', 'isuzu-npr'),
    ('MAN', 'TGL 8.180', '181 TU 8902', 'CAMION', 'man-tgl'),
    ('DAF', 'LF 230', '187 TU 2057', 'CAMION', 'daf-lf'),
    ('Ford', 'Transit L3H2', '193 TU 3391', 'VAN', 'ford-transit'),
    ('Toyota', 'Hilux Double Cabine', '198 TU 4726', 'AUTRE', 'toyota-hilux'),
]

EQUIPEMENTS = [
    ('Extincteur 2 kg ABC', 'Securite', 'extincteur'),
    ('Triangle de presignalisation', 'Securite', 'triangle'),
    ('Gilet haute visibilite', 'Securite', 'gilet'),
    ('Trousse de premiers secours', 'Securite', 'trousse'),
    ('Sangle d arrimage 5 t', 'Outillage', 'sangle'),
    ('Cric hydraulique 3 t', 'Outillage', 'cric'),
    ('Cle dynamometrique', 'Outillage', 'cle-dyna'),
    ('Boitier telematique GPS', 'Electronique', 'boitier-gps'),
    ('Chronotachygraphe numerique', 'Electronique', 'tachygraphe'),
    ('Camera de recul', 'Electronique', 'camera-recul'),
    ('Hayon elevateur 1500 kg', 'Mecanique', 'hayon'),
    ('Compresseur portatif 12 V', 'Mecanique', 'compresseur'),
    ('Terminal mobile durci', 'Informatique', 'terminal'),
    ('Bache de protection 6x4 m', 'Autre', 'bache'),
]

if __name__ == '__main__':
    for d_ in ('avatars', 'vehicules', 'equipements'):
        os.makedirs(os.path.join(BASE, d_), exist_ok=True)

    for i, (ini, slug) in enumerate(AVATARS):
        avatar(ini, os.path.join(BASE, 'avatars', 'demo-%s.png' % slug), i)
    for i, (ma, mo, pl, ty, slug) in enumerate(VEHICULES):
        vehicule(ma, mo, pl, ty, os.path.join(BASE, 'vehicules', 'demo-%s.jpg' % slug))
    for i, (nom, cat, slug) in enumerate(EQUIPEMENTS):
        equipement(nom, cat, os.path.join(BASE, 'equipements', 'demo-%s.jpg' % slug), i)

    print('avatars     : %d' % len(AVATARS))
    print('vehicules   : %d' % len(VEHICULES))
    print('equipements : %d' % len(EQUIPEMENTS))
