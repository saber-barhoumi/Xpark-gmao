# -*- coding: utf-8 -*-
"""Detecte les fins de rangee de tableau corrompues.

En LaTeX, une rangee de tableau se termine par DEUX antislashs. Un seul
antislash en fin de ligne est presque toujours le signe d'un outil qui a
mange l'echappement : le document ne compilerait pas.
"""
import io
import glob

BS = chr(92)

print('%-48s %9s %9s' % ('fichier', 'suspects', 'fins ok'))
print('-' * 70)
total = 0
for f in sorted(glob.glob('*.tex') + glob.glob('*/*.tex')):
    s = io.open(f, encoding='utf-8').read()
    suspects = []
    for i, l in enumerate(s.splitlines(), 1):
        d = l.rstrip()
        if d.endswith(BS) and not d.endswith(BS * 2):
            suspects.append(i)
        # rangee de tableau dont la fin est un antislash SEUL suivi d'une
        # commande, par exemple "\ \midrule" au lieu de "\\ \midrule".
        # Le cas correct "\\ \midrule" ne doit pas etre signale.
        elif '&' in d:
            j = d.find(BS + ' ')
            while j >= 0:
                avant = d[j - 1] if j > 0 else ' '
                if avant != BS:
                    suspects.append(i)
                    break
                j = d.find(BS + ' ', j + 2)
    ok = s.count(BS * 2)
    if suspects:
        total += len(suspects)
        print('%-48s %9d %9d   lignes %s'
              % (f, len(suspects), ok, suspects[:8]))
    else:
        print('%-48s %9d %9d' % (f, 0, ok))

print('-' * 70)
print('Lignes suspectes au total : %d' % total)
if total:
    print()
    print('  Ces lignes empecheraient la compilation.')
