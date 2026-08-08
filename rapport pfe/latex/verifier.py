# -*- coding: utf-8 -*-
"""Controle statique du projet LaTeX.

A defaut de distribution LaTeX installee sur la machine, c'est la
verification la plus poussee possible avant compilation reelle :
  1. les cibles d'inclusion existent ;
  2. les images referencees sont presentes dans figures/ ;
  3. accolades et environnements sont equilibres ;
  4. toute reference croisee possede son etiquette.

Usage :  python verifier.py
"""
import io
import os
import re
import glob

B = r'\\'                      # antislash litteral, en syntaxe d'expression

tex = sorted(glob.glob('*.tex') + glob.glob('*/*.tex'))
pb = []

# --- 1. cibles d'inclusion -------------------------------------------
for f in tex:
    s = io.open(f, encoding='utf-8').read()
    for m in re.finditer(r'^[ \t]*' + B + r'input\{([^}]+)\}', s, re.M):
        cible = m.group(1)
        if not (os.path.exists(cible + '.tex') or os.path.exists(cible)):
            pb.append('%s : input{%s} introuvable' % (f, cible))

# --- 2. images --------------------------------------------------------
dispo = {}
for d in ('figures', 'figures/diagrammes', 'figures/logos',
          'figures/captures', 'figures/planning'):
    if os.path.isdir(d):
        for n in os.listdir(d):
            dispo.setdefault(n, d)

# Position de l'argument image et de l'argument etiquette dans chaque macro
MACROS = {'figReelle': ([0], 2), 'figDeux': ([0, 1], 3),
          'figTrois': ([0, 1, 2], 4), 'figPaysage': ([0], 2),
          'figAttendue': ([], 2), 'captureAttendue': ([], 2)}
utilisees = set()
labels_macro = set()

# Le fichier de macros contient les DEFINITIONS : #1, #2... n'y sont pas
# des noms de fichiers. Il est donc exclu des controles 2 et 4.
CORPS = [f for f in tex if 'macros' not in f]

for f in CORPS:
    s = io.open(f, encoding='utf-8').read()
    for mac, (indices, i_label) in MACROS.items():
        for m in re.finditer(B + mac + r'((?:\s*\{[^{}]*\})+)', s):
            args = re.findall(r'\{([^{}]*)\}', m.group(1))
            if i_label < len(args):
                labels_macro.add(args[i_label].strip())
            for i in indices:
                if i < len(args):
                    a = args[i].strip()
                    utilisees.add(a)
                    if a not in dispo:
                        pb.append('%s : image "%s" absente de figures/' % (f, a))
    for m in re.finditer(B + r'includegraphics(?:\[[^\]]*\])?\{([^}]+)\}', s):
        a = m.group(1).strip()
        if not a.startswith(chr(92)):
            utilisees.add(a)
            if a not in dispo:
                pb.append('%s : includegraphics{%s} absent' % (f, a))

# --- 3. equilibrage ---------------------------------------------------
for f in tex:
    s = re.sub(r'(?<!' + B + r')%.*', '', io.open(f, encoding='utf-8').read())
    if s.count('{') != s.count('}'):
        pb.append('%s : accolades desequilibrees (%d ouvrantes, %d fermantes)'
                  % (f, s.count('{'), s.count('}')))
    ouv = re.findall(B + r'begin\{([A-Za-z]+\*?)\}', s)
    fer = re.findall(B + r'end\{([A-Za-z]+\*?)\}', s)
    for e in set(ouv) | set(fer):
        if ouv.count(e) != fer.count(e):
            pb.append('%s : environnement %s (%d begin / %d end)'
                      % (f, e, ouv.count(e), fer.count(e)))

# --- 4. references croisees ------------------------------------------
labels, refs = set(labels_macro), set()
for f in CORPS:
    s = io.open(f, encoding='utf-8').read()
    labels |= set(re.findall(B + r'label\{([^}]+)\}', s))
    refs |= set(re.findall(B + r'ref\{([^}]+)\}', s))
for r in sorted(refs - labels):
    pb.append('reference "%s" citee sans etiquette correspondante' % r)

print('Fichiers .tex        : %d' % len(tex))
print('Images referencees   : %d' % len(utilisees))
print('Images disponibles   : %d' % len(dispo))
print('Etiquettes definies  : %d' % len(labels))
print('Anomalies            : %d' % len(pb))
for x in pb:
    print('   ' + x)
