# -*- coding: utf-8 -*-
"""Estimation de la pagination du rapport, source par source.

A defaut de distribution LaTeX installee, ce script approche le nombre de
pages a partir du volume de texte, de la hauteur reelle des images et du
nombre de lignes des tableaux. Ce n'est PAS une mesure : c'est un ordre
de grandeur, destine a piloter le budget de 80 pages. L'ecart constate
sur un rapport comparable est de l'ordre de 10 pour cent.

Usage :  python budget-pages.py
"""
import io
import os
import re
import glob

try:
    from PIL import Image
except ImportError:
    Image = None

B = r'\\'

# --- Geometrie de la page (classe report, 12 pt, marges 2,5 cm) --------
LARGEUR_TEXTE_CM = 21.0 - 2 * 2.5          # 16,0 cm
HAUTEUR_TEXTE_CM = 29.7 - 2 * 2.5 - 1.6    # 23,1 cm, en-tete deduit
CARACTERES_PAR_PAGE = 2900                 # Times 12 pt, interligne 1,15
CM_PAR_LIGNE_TABLEAU = 0.70
CM_SOCLE_TABLEAU = 1.60
CM_LEGENDE = 0.85
CM_TITRE_CHAPITRE = 6.50                   # titre + blanc avant
CM_TITRE_SECTION = 1.30
CM_TITRE_SOUSSECTION = 0.95

DOSSIERS_FIG = ('figures', 'figures/diagrammes', 'figures/logos',
                'figures/captures', 'figures/planning')

_cache = {}


def rapport_hauteur(nom):
    """Retourne hauteur/largeur de l'image, 0.62 par defaut."""
    if nom in _cache:
        return _cache[nom]
    for d in DOSSIERS_FIG:
        p = os.path.join(d, nom)
        if os.path.exists(p) and Image is not None:
            try:
                w, h = Image.open(p).size
                _cache[nom] = h / float(w)
                return _cache[nom]
            except Exception:
                pass
    _cache[nom] = 0.62
    return 0.62


def cm_figure(nom, fraction):
    """Hauteur occupee par une figure, legende comprise, bornee a la page."""
    h = LARGEUR_TEXTE_CM * float(fraction) * rapport_hauteur(nom)
    return min(h, HAUTEUR_TEXTE_CM - CM_LEGENDE) + CM_LEGENDE


def analyser(chemin):
    src = io.open(chemin, encoding='utf-8').read()
    src = re.sub(r'(?<!' + B + r')%.*', '', src)          # commentaires
    cm = 0.0
    figures = 0

    # --- figures
    for m in re.finditer(B + r'figReelle((?:\s*\{[^{}]*\})+)', src):
        a = re.findall(r'\{([^{}]*)\}', m.group(1))
        if len(a) >= 4:
            cm += cm_figure(a[0].strip(), a[3].strip())
            figures += 1
    for mac, nb in (('figDeux', 2), ('figTrois', 3)):
        for m in re.finditer(B + mac + r'((?:\s*\{[^{}]*\})+)', src):
            a = re.findall(r'\{([^{}]*)\}', m.group(1))
            if len(a) >= nb + 2:
                frac = a[nb + 2].strip() if len(a) > nb + 2 else '0.8'
                h = sum(LARGEUR_TEXTE_CM * float(frac) * rapport_hauteur(a[i].strip())
                        for i in range(nb))
                cm += min(h, HAUTEUR_TEXTE_CM - CM_LEGENDE) + CM_LEGENDE
                figures += 1
    for m in re.finditer(B + r'(?:figAttendue|captureAttendue)', src):
        cm += 5.4 + CM_LEGENDE
        figures += 1
    # figures composees a la main
    for m in re.finditer(B + r'begin\{figure\}', src):
        bloc = src[m.start():m.start() + 1200]
        if B.replace('\\\\', '\\') and 'includegraphics' in bloc:
            hs = re.findall(r'height=([\d.]+)cm', bloc)
            if hs:
                cm += max(float(x) for x in hs) + CM_LEGENDE
                figures += 1

    # --- tableaux
    #  Une rangee ne fait pas une ligne : le texte d'une cellule se
    #  replie. On estime le nombre de lignes affichees a partir du
    #  nombre de caracteres de la rangee, rapporte a la largeur utile.
    #  Sans cela, les tableaux de recits utilisateur etaient sous-evalues
    #  du simple au double.
    tableaux = 0
    for m in re.finditer(B + r'begin\{(tabularx|longtable|tabular)\}', src):
        fin = src.find('end{' + m.group(1) + '}', m.start())
        corps = src[m.start():fin if fin > 0 else len(src)]
        petit = ('small' in src[max(0, m.start() - 200):m.start()])
        car_par_ligne = 108 if petit else 92
        lignes_affichees = 0
        for rangee in corps.split(r'\\'):
            r_ = re.sub(B + r'[a-zA-Z]+\*?(\[[^\]]*\])?', '', rangee)
            r_ = re.sub(r'[{}&]', ' ', r_).strip()
            if not r_:
                continue
            lignes_affichees += max(1, int(len(r_) / car_par_ligne) + 1)
        cm += (CM_SOCLE_TABLEAU + lignes_affichees * CM_PAR_LIGNE_TABLEAU
               + CM_LEGENDE)
        tableaux += 1

    # --- titres
    cm += len(re.findall(B + r'chapter\{', src)) * CM_TITRE_CHAPITRE
    cm += len(re.findall(B + r'section\*?\{', src)) * CM_TITRE_SECTION
    cm += len(re.findall(B + r'subsection\*?\{', src)) * CM_TITRE_SOUSSECTION

    # --- texte : on retire environnements lourds et commandes
    txt = src
    for env in ('tabularx', 'longtable', 'tabular', 'figure', 'tcolorbox'):
        txt = re.sub(B + r'begin\{' + env + r'\}.*?' + B + r'end\{' + env + r'\}',
                     '', txt, flags=re.S)
    txt = re.sub(B + r'[a-zA-Z]+\*?(\[[^\]]*\])?', ' ', txt)
    txt = re.sub(r'[{}]', '', txt)
    txt = re.sub(r'\s+', ' ', txt)
    cm += (len(txt) / float(CARACTERES_PAR_PAGE)) * HAUTEUR_TEXTE_CM

    return cm / HAUTEUR_TEXTE_CM, figures, tableaux


# --- Pieces sans source .tex mesurable ---------------------------------
#  La table des figures et la liste des tableaux etaient forfaitisees a
#  2,0 et 1,0 page. C'est faux : elles comptent exactement une ligne par
#  figure et par tableau. Elles sont desormais DEDUITES du decompte reel,
#  ce qui rend la projection plus juste.
LIGNES_PAR_PAGE_LISTE = 42.0
FORFAITS = [
    ('Page de garde + validation de depot', 2.0),
    ('Table des matieres', 2.5),
]

# --- Plafond par piece, en pages ---------------------------------------
#  Le plafond a ete releve a 100 pages, annexes comprises. La cible de
#  travail est 92 pages : l'estimation porte une incertitude d'environ
#  10 pour cent, cette marge absorbe l'ecart.
PLAFOND_TOTAL = 100
CIBLE_TOTALE = 92
PLAFONDS = {
    'chapitres/00-introduction-generale.tex': 2.0,
    'chapitres/01-etude-prealable.tex': 8.5,
    'chapitres/02-analyse-globale.tex': 8.5,
    'chapitres/03-environnement-architecture.tex': 7.0,
    'chapitres/04-sprint1-iam.tex': 7.0,
    'chapitres/05-sprint2-flotte.tex': 7.0,
    'chapitres/06-sprint3-mission.tex': 7.2,
    'chapitres/07-sprint4-maintenance.tex': 7.0,
    'chapitres/08-sprint5-finance-alertes.tex': 7.0,
    'chapitres/09-sprint6-collaboration-ia.tex': 7.0,
    'chapitres/10-conclusion-generale.tex': 2.8,
}

if __name__ == '__main__':
    print('%-46s %7s %5s %5s' % ('Piece', 'pages', 'fig.', 'tab.'))
    print('-' * 66)
    total = 0.0
    for nom, p in FORFAITS:
        print('%-46s %7.1f %5s %5s' % (nom, p, '-', '-'))
        total += p

    fichiers = (sorted(glob.glob('liminaires/*.tex')) +
                sorted(glob.glob('chapitres/*.tex')) +
                sorted(glob.glob('annexes/*.tex')) +
                sorted(glob.glob('biblio/*.tex')))
    tf = tt = 0
    depassements = []
    for f in fichiers:
        p, nf, nt = analyser(f)
        total += p
        tf += nf
        tt += nt
        cle = f.replace(os.sep, '/')
        plafond = PLAFONDS.get(cle)
        marque = ''
        if plafond is not None and p > plafond + 0.05:
            marque = '  DEPASSE (plafond %.1f)' % plafond
            depassements.append((cle, p, plafond))
        print('%-46s %7.1f %5d %5d%s' % (cle, p, nf, nt, marque))

    # Chapitres au plan mais pas encore rediges
    restants = [(c, v) for c, v in sorted(PLAFONDS.items())
                if not os.path.exists(c)]
    if restants:
        print('-' * 66)
        for c, v in restants:
            print('%-46s %7.1f %5s %5s' % (c + '  (a rediger)', v, '-', '-'))
        total += sum(v for _, v in restants)
    for nom, v in (('biblio/references.tex  (a rediger)', 1.0),
                   ('annexes/  (a rediger)', 1.5)):
        if not glob.glob(nom.split()[0] + '*'):
            print('%-46s %7.1f %5s %5s' % (nom, v, '-', '-'))
            total += v

    # Tables des figures et des tableaux : une ligne par entree
    p_fig = max(1.0, tf / LIGNES_PAR_PAGE_LISTE)
    p_tab = max(1.0, tt / LIGNES_PAR_PAGE_LISTE)
    print('-' * 66)
    print('%-46s %7.1f %5d %5s' % ('Table des figures  (deduite)', p_fig, tf, '-'))
    print('%-46s %7.1f %5s %5d' % ('Liste des tableaux  (deduite)', p_tab, '-', tt))
    total += p_fig + p_tab

    print('=' * 66)
    print('%-46s %7.1f %5d %5d' % ('TOTAL PROJETE', total, tf, tt))
    print()
    if depassements:
        print('  %d piece(s) au-dela de leur plafond :' % len(depassements))
        for c, p, v in depassements:
            print('     %-44s %.1f > %.1f' % (c, p, v))
        print()
    if total > PLAFOND_TOTAL:
        print('  DEPASSEMENT : %.0f pages au-dela du plafond de %d.'
              % (total - PLAFOND_TOTAL, PLAFOND_TOTAL))
    elif total > CIBLE_TOTALE:
        print('  Sous le plafond de %d, mais au-dela de la cible de %d :'
              % (PLAFOND_TOTAL, CIBLE_TOTALE))
        print('  la marge d incertitude de 10 pour cent n est plus couverte.')
    else:
        print('  %.0f pages, sous la cible de %d et le plafond de %d.'
              % (total, CIBLE_TOTALE, PLAFOND_TOTAL))
