#!/usr/bin/env python3
"""Valida cruces del Mundial 2026 a partir de un texto de resultados.

Uso:
    python3 verificar_cruces_mundial.py resultados.txt
    pbpaste | python3 verificar_cruces_mundial.py
"""

from __future__ import annotations

import argparse
import base64
import json
import re
import sys
import zlib
from dataclasses import dataclass


GROUPS = "ABCDEFGHIJKL"

# Tabla oficial de 495 combinaciones de terceros clasificados en dieciseisavos.
# JSON comprimido: { "ABCDEFGH": "..." }. El valor corresponde a las columnas
# 1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L, indicando el grupo del tercero asignado.
THIRD_TABLE_B85 = (
    "c-mc=OOouk4ny~H$Gw7{RZ5~h&K-5Uy}!z|2^`)jf&mf|NXhble|}!AkC^Mvzkk+zwV&wY&p(OoU$o6v|B11U9;3(TW%M%o7Wy{t"
    "`tYvt&1T;9;a%si8rJ1l^R5r?ieI#YcYiB8f7QFcm5mR&&9L7>-;O<(8611wLXqtPgJS2c?X!~IHOyPvjUJ<yQ82uPI@|ne8((yr"
    ";j8UI&G6NBqt-T$V~=AGV$FL2RqWc@A!u7$JA@k6w}u;a4eMLO!{FF&4L54V>jHyf_pRd8Z2MMmYPNl=*p=a2h)p!GZ}wzh-=ZI*"
    "mr*dl>r3c%w`?<Pcgr@z27_xjjy;Y&h&As8RI%7MXnXc8%1XwwZ&6k<uy0Vj*cVd#>|50J-RP_h6b#CC?_1kd#l3G&Y@+kgR{LT;"
    "+G=0SM_cWS`Dm+sF&|IXzL<};+7}br<_4;Ir?cJK_FoLpHifQ@ZrMQ5EnDbaS@rt5c~|xNzR_LKQ92;Idz22y$u&v`3@~VQG$%)3"
    "a;XDGU~<V1BQUw-hY^@u>VOfLT<U-km|S6P>;P-S<U$RYT&RH^V8xhRP>jii8Zfz#4U-GmFuA~h$z^mx+myDa1HS99He$6p>+M);"
    "o5QizHl^+9fQLb`&^9+v)jOSSC&SNfW`H(zz*yk5iUnS)SXeVxw!mw23q=jVSt6$fXNmSLI7_r|!C4}w24{(!8k{BJ8Z=A7D;b_8"
    ";gt-|5-@0%gjX^+ORR#k#40#T%*$C~l(R(WWHzao%qA6cLB%oyvPs2cHld4XGIY!{-v&G8nQyNh^UU|Yj(O&LU&lQ2iQX~Ke7<$e"
    "GoNoA^UNoD$2{|i-Z9U7>UGSsqD}Lx)S!7*YEaJ?#p?N@So5sZpx!Lm)SD%ndb2R73yDr>o6_ca)-?$_=2_Py=$L0+^Q>c@b<MMm"
    "dDh{b32k!&RlU>MFweRfplu3W;I)bcUaMGGGgr32Yn1a$HDI2>shDTjH_S8a8|E3Dig^a7VxD0)bDl+6$((0VRuc29Fx=XrtR&_c"
    "Rd~Wsh36T0Jz<D?mH?g1CKZ#}qyqB{J2aV1DkifDT||>%g!>}Y7bDykAxDjHUxXYr!hI3yixKXNP+yF2Uj%EAe|<WQa9{Xz8o|B@"
    "GsvkvoklG1TEzmdRk$x$*#fUo_JwMg&i1pUVmjL|n%QzUzbcj)%)6vwGMmsvG#LVp@=69A<&})AVR0n`j`B(d90fFMSX_r$&?mOx"
    "+#LE^Y&bWMUS}H4&7tqYhI2FYJ>PV0ws~}BHJzJn4)t-<xp|{+$39=eM`u>kxp||=c7Z{$*+W%Zo|~cXtcG(l^qtjkZdS$FLsfB}"
    "o1yQlrgO8MsyJ_WRq^vBJa$o$H@u=v)Bfmnrs>@L?vS-<+7D{ev_E>CX+Af<sI+O?4{FQ#@QvL--$I=&J8Kt)r(5pWMAa=tg}SAv"
    "$Zi>hSKU(TRc|sjxRP>-&rQ0-=O$eeTuHekC+*|ZCG-M=VmG|Lfr3HV9+ynIMBf2-Y@%ApqCzWKROCuVSskrpsduL*S%aor@q?yZ"
    "@q?!vvuVl|KWNGo)bk7sqweO@7bDmgxxORV7rDNp?&ff;Rpi_m!M+IBfWAOB^aZk^FTjAlFv`9#FZ;s0><ciUFO0G;gzDV<)UY;C"
    "Rkkvl&&{oGvgUL1j!l%=@*Kjs35F<+O2ttem5QS{D$D>!8Kt9y7DpvI3;NXC=`)>gojy|^clu0y-03r&Z=F8V`PS((^;@UUN;d6K"
    "$)+7D4B8>0_8EEYGxFMJg+V?e>OBSupXn>9(`Wih>hziJ%AGzV%52)VMKojSGb^Ugte8Ht3i^zweFhYcGCB+T)H?#Jqr375td8!="
    "Bd|KU6_3E`5cN8Qvn`?-JAvx{8>}}OUcOI${z<I6FJ8P)zS_C(lP}*VpI9)wg}xoDKP!j4`m-|beS7gf`9a@~)t{BaZ2GfunC$|C"
    "Vwe6nQrprW$Aub}{x~kwu=MYMiv4GWiq{1O#rp3975nc46>l+YF!=8SwBa@MbZNu8^6DG0Z=r9;>NWKA;aI(fo-S>8S6<yUY`y#+"
    "WZQcAKggypwYI@<F2p8^cV(!+yE0VZT^W_(T^Xpq^-u%fmCt>jeEB|kyLuxQUU#fl^1e^Lc%S^n9-$Xd#cp_g1BKU>ZHr-p;arGK"
    "bZz)|1BHLLQ2p0KWy|gZx{bO9Pi6YSQ<;9iS2Om)Q<;A7R3?h=V>67pn@?Zx9j0j=_zu&w4x{eoaI95i&+{FoX?1YUe_}UKc^%o%"
    "7hphN7-e6WmwjPg_5~Qw7e?6^LMOA$4O9#>v*8`4J+COQ#&?*urch=Rx`-x26i21vD2__SQ5+R!fTN7kQ9_HO5}gHo>g9dX=Ub=G"
    ")Nh?WQ@`;(>GO^ENuO_>K2sO+KIy5!`=qA^@00FW-X}dZI(<eJcn60Hyn~}Myn_Sv9;1fIY;yw@!^~{(Sx=XA`m8VQ&}25Di)b>?"
    "XI@GA%qvNsSp|LOm88#r!ck_J1%2wpee%2_R|ogWFM3zT`{XN98}5^LY@%L=aJEG>8F-(3B?Ir1VrcG*&%4HR=W6bY&wJnFsOG-7"
    "(YIsuw({J$n)~8LzkSi%7Y~DC^E4f~o6UW3qt3R)u)%OH#3s7@HV75VZ-Y>={5FWnmfr?}ZlkV&-}BEcsFm-myal!Lot5{UR=%@{"
    "=5GGR9-;i6SFGH3ulfdxz1Twa&LwSf-xHf?D*lbt`pSKuS1QHYXQ;P)XXRPg%6C?tg{^#N<*C=ocNS5uj?l6?iOzyP9T2tNJGPg4"
    "b0vGJH&?QkdUG9msh6nh?as!pX2s5e-u3oUZ!(Nv>^(L9_kRg*Qmp"
)


@dataclass
class Match:
    number: int
    team1: str
    team2: str
    winner: str
    section: str


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip()).casefold()


def load_third_table() -> dict[str, str]:
    raw = zlib.decompress(base64.b85decode(THIRD_TABLE_B85.encode()))
    return json.loads(raw)


def parse_sections(text: str) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {}
    current = ""
    for raw_line in text.splitlines():
        line = raw_line.strip().strip("`")
        if not line:
            continue
        header = line.upper()
        if header in {
            "FASE DE GRUPOS",
            "MEJORES TERCEROS",
            "DIECISEISAVOS",
            "OCTAVOS",
            "CUARTOS",
            "SEMIFINALES",
            "TERCER PUESTO",
            "FINAL",
            "PODIO",
        }:
            current = header
            sections.setdefault(current, [])
        elif current:
            sections[current].append(line)
    return sections


def parse_groups(lines: list[str], errors: list[str]) -> dict[str, dict[int, str]]:
    groups: dict[str, dict[int, str]] = {}
    position_re = re.compile(r"([1-4])\s*\.\s*º\s*(.*?)(?=,\s*[1-4]\s*\.\s*º|$)")
    for line in lines:
        match = re.match(r"Grupo\s+([A-L]):\s*(.+)$", line, re.I)
        if not match:
            errors.append(f"No entiendo la línea de grupo: {line}")
            continue
        group, rest = match.groups()
        positions = {int(pos): team.strip() for pos, team in position_re.findall(rest)}
        if set(positions) != {1, 2, 3, 4}:
            errors.append(f"El Grupo {group} no tiene posiciones 1-4 completas.")
        groups[group.upper()] = positions
    missing = set(GROUPS) - set(groups)
    if missing:
        errors.append(f"Faltan grupos: {', '.join(sorted(missing))}.")
    return groups


def parse_best_thirds(lines: list[str]) -> dict[str, str]:
    passed: dict[str, str] = {}
    text = "\n".join(line for line in lines if line.casefold().startswith("pasan:"))
    for team, group in re.findall(r"3\s*\.\s*º\s*([^()]+?)\s*\(Grupo\s+([A-L])\)", text, re.I):
        passed[group.upper()] = team.strip().rstrip(",")
    return passed


def parse_matches(sections: dict[str, list[str]], errors: list[str]) -> dict[int, Match]:
    matches: dict[int, Match] = {}
    match_re = re.compile(r"Partido\s+(\d+):\s*(.*?)\s+vs\s+(.*?)\s*->\s*gana\s+(.+)$", re.I)
    for section in ("DIECISEISAVOS", "OCTAVOS", "CUARTOS", "SEMIFINALES", "TERCER PUESTO", "FINAL"):
        for line in sections.get(section, []):
            found = match_re.match(line)
            if not found:
                errors.append(f"No entiendo la línea de partido en {section}: {line}")
                continue
            number_s, team1, team2, winner = found.groups()
            number = int(number_s)
            matches[number] = Match(number, team1.strip(), team2.strip(), winner.strip(), section)
    return matches


def expected_round_of_32(groups: dict[str, dict[int, str]], passed: dict[str, str], errors: list[str]) -> dict[int, tuple[str, str]]:
    fixed = {
        73: ("A2", "B2"),
        75: ("F1", "C2"),
        76: ("C1", "F2"),
        78: ("E2", "I2"),
        83: ("K2", "L2"),
        84: ("H1", "J2"),
        86: ("J1", "H2"),
        88: ("D2", "G2"),
    }
    expected = {num: (team(ref1, groups), team(ref2, groups)) for num, (ref1, ref2) in fixed.items()}

    combo = "".join(sorted(passed))
    table = load_third_table()
    if len(passed) != 8:
        errors.append(f"Deben pasar 8 terceros; pasan {len(passed)}.")
        return expected
    if combo not in table:
        errors.append(f"La combinación de terceros '{combo}' no existe en la tabla oficial.")
        return expected

    slot_order = ["1A", "1B", "1D", "1E", "1G", "1I", "1K", "1L"]
    slot_to_match = {"1A": 79, "1B": 85, "1D": 81, "1E": 74, "1G": 82, "1I": 77, "1K": 87, "1L": 80}
    for slot, third_group in zip(slot_order, table[combo]):
        winner_group = slot[-1]
        expected[slot_to_match[slot]] = (groups[winner_group][1], passed[third_group])
    return expected


def team(ref: str, groups: dict[str, dict[int, str]]) -> str:
    return groups[ref[0]][int(ref[1])]


def same_pair(actual: Match, expected: tuple[str, str]) -> bool:
    return norm(actual.team1) == norm(expected[0]) and norm(actual.team2) == norm(expected[1])


def validate_pair(number: int, expected: tuple[str, str], matches: dict[int, Match], errors: list[str]) -> None:
    actual = matches.get(number)
    if not actual:
        errors.append(f"Falta el Partido {number}.")
        return
    if not same_pair(actual, expected):
        errors.append(
            f"Partido {number}: esperado '{expected[0]} vs {expected[1]}', "
            f"pero aparece '{actual.team1} vs {actual.team2}'."
        )
    if norm(actual.winner) not in {norm(actual.team1), norm(actual.team2)}:
        errors.append(f"Partido {number}: el ganador '{actual.winner}' no juega ese partido.")


def winner(matches: dict[int, Match], number: int) -> str:
    return matches[number].winner


def loser(matches: dict[int, Match], number: int) -> str:
    match = matches[number]
    if norm(match.winner) == norm(match.team1):
        return match.team2
    if norm(match.winner) == norm(match.team2):
        return match.team1
    return ""


def validate_knockout(matches: dict[int, Match], errors: list[str]) -> None:
    rounds = {
        89: (74, 77),
        90: (73, 75),
        91: (76, 78),
        92: (79, 80),
        93: (83, 84),
        94: (81, 82),
        95: (86, 88),
        96: (85, 87),
        97: (89, 90),
        98: (93, 94),
        99: (91, 92),
        100: (95, 96),
        101: (97, 98),
        102: (99, 100),
        104: (101, 102),
    }
    for number, (left, right) in rounds.items():
        if left not in matches or right not in matches:
            continue
        validate_pair(number, (winner(matches, left), winner(matches, right)), matches, errors)
    if 101 in matches and 102 in matches:
        validate_pair(103, (loser(matches, 101), loser(matches, 102)), matches, errors)


def parse_podium(lines: list[str]) -> dict[str, str]:
    podium: dict[str, str] = {}
    labels = {
        "campeón": "campeon",
        "campeon": "campeon",
        "subcampeón": "subcampeon",
        "subcampeon": "subcampeon",
        "tercer puesto": "tercero",
        "cuarto puesto": "cuarto",
    }
    for line in lines:
        if ":" not in line:
            continue
        label, value = line.split(":", 1)
        key = labels.get(norm(label))
        if key:
            podium[key] = value.strip()
    return podium


def validate_podium(matches: dict[int, Match], podium: dict[str, str], errors: list[str]) -> None:
    expected = {}
    if 104 in matches:
        expected["campeon"] = winner(matches, 104)
        expected["subcampeon"] = loser(matches, 104)
    if 103 in matches:
        expected["tercero"] = winner(matches, 103)
        expected["cuarto"] = loser(matches, 103)
    for key, value in expected.items():
        if key not in podium:
            errors.append(f"Falta en PODIO: {key}.")
        elif norm(podium[key]) != norm(value):
            errors.append(f"PODIO {key}: esperado '{value}', pero aparece '{podium[key]}'.")


def validate_text(text: str) -> list[str]:
    errors: list[str] = []
    sections = parse_sections(text)
    groups = parse_groups(sections.get("FASE DE GRUPOS", []), errors)
    if set(groups) != set(GROUPS):
        return errors

    passed = parse_best_thirds(sections.get("MEJORES TERCEROS", []))
    for group, third_team in passed.items():
        if group in groups and norm(groups[group][3]) != norm(third_team):
            errors.append(
                f"MEJORES TERCEROS: en Grupo {group} debería figurar '{groups[group][3]}', "
                f"pero aparece '{third_team}'."
            )

    matches = parse_matches(sections, errors)
    for number, expected in sorted(expected_round_of_32(groups, passed, errors).items()):
        validate_pair(number, expected, matches, errors)
    validate_knockout(matches, errors)
    validate_podium(matches, parse_podium(sections.get("PODIO", [])), errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Valida cruces del Mundial 2026 desde un texto.")
    parser.add_argument("archivo", nargs="?", help="Archivo de texto. Si se omite, lee de stdin.")
    args = parser.parse_args()

    if args.archivo:
        with open(args.archivo, "r", encoding="utf-8") as handle:
            text = handle.read()
    else:
        text = sys.stdin.read()

    errors = validate_text(text)
    if errors:
        print(f"ERROR: {len(errors)} problema(s) encontrado(s):")
        for error in errors:
            print(f"- {error}")
        return 1
    print("OK: todos los cruces, ganadores y podio son correctos.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
