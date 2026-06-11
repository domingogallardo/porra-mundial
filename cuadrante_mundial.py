from PIL import Image, ImageDraw, ImageFont
import argparse
import os
import sys

from verificar_cruces_mundial import parse_matches, parse_sections, validate_text

# Instala Pillow si no lo tienes:
#   python3 -m pip install pillow
#
# Ejecútalo:
#   python3 cuadrante_mundial.py --nombre Carlos porra.txt
#
# También puedes usar stdin:
#   pbpaste | python3 cuadrante_mundial.py
#
# Genera:
#   cuadrante_mundial_2026_revisado.png
#   cuadrante_mundial_2026_revisado.pdf


def parse_args():
    parser = argparse.ArgumentParser(
        description="Genera PNG/PDF del cuadro final del Mundial 2026."
    )
    parser.add_argument(
        "archivo",
        nargs="?",
        help="Texto de la porra. Usa '-' o no pases archivo para leer de stdin.",
    )
    parser.add_argument(
        "--prefix",
        default="cuadrante_mundial_2026_revisado",
        help="Prefijo para los archivos generados.",
    )
    parser.add_argument(
        "--nombre",
        help="Nombre de la persona que hace el pronóstico para mostrarlo en la cabecera.",
    )
    return parser.parse_args()


def load_matches_from_text(text):
    errors = validate_text(text)
    if errors:
        print(f"ERROR: el texto no pasa la validación ({len(errors)} problema(s)):")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    parse_errors = []
    matches = parse_matches(parse_sections(text), parse_errors)
    if parse_errors:
        print("ERROR: no se pudieron leer todos los partidos:")
        for error in parse_errors:
            print(f"- {error}")
        raise SystemExit(1)
    return matches


def match_tuple(matches, number):
    match = matches[number]
    return (str(number), match.team1, match.team2, match.winner)


def apply_text_bracket(text):
    global left_r16, right_r16, left_r8, right_r8, left_qf, right_qf, left_sf, right_sf, final

    matches = load_matches_from_text(text)
    required = tuple(range(73, 105))
    missing = [number for number in required if number not in matches]
    if missing:
        print(f"ERROR: faltan partidos para dibujar: {', '.join(map(str, missing))}.")
        raise SystemExit(1)

    left_r16 = [match_tuple(matches, n) for n in (74, 77, 73, 75, 83, 84, 81, 82)]
    right_r16 = [match_tuple(matches, n) for n in (76, 78, 79, 80, 86, 88, 85, 87)]
    left_r8 = [match_tuple(matches, n) for n in (89, 90, 93, 94)]
    right_r8 = [match_tuple(matches, n) for n in (91, 92, 95, 96)]
    left_qf = [match_tuple(matches, n) for n in (97, 98)]
    right_qf = [match_tuple(matches, n) for n in (99, 100)]
    left_sf = [match_tuple(matches, 101)]
    right_sf = [match_tuple(matches, 102)]
    final = match_tuple(matches, 104)


def read_input(args):
    if args.archivo and args.archivo != "-":
        with open(args.archivo, "r", encoding="utf-8") as handle:
            return handle.read()
    if sys.stdin.isatty():
        print("ERROR: pasa un archivo de porra o envía el texto por stdin.")
        print("Ejemplos:")
        print("  python3 cuadrante_mundial.py porra.txt")
        print("  pbpaste | python3 cuadrante_mundial.py")
        raise SystemExit(2)
    return sys.stdin.read()


args = parse_args()
apply_text_bracket(read_input(args))

W, H = 3200, 1850
img = Image.new("RGB", (W, H), "white")
draw = ImageDraw.Draw(img)

def font(size=36, bold=False):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
    ]
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size=size)
    return ImageFont.load_default()

def fitted_font(text, size, bold, max_width, min_size=18):
    current_size = size
    while current_size > min_size:
        candidate = font(current_size, bold)
        width = draw.textbbox((0, 0), text, font=candidate)[2]
        if width <= max_width:
            return candidate
        current_size -= 1
    return font(min_size, bold)

title_font = font(58, True)
header_font = font(30, True)
team_font = font(27)
team_bold = font(28, True)
small_font = font(22)
small_bold = font(23, True)
champ_font = font(34, True)

line = (55, 55, 55)
box = (250, 250, 250)
winner_fill = (232, 244, 255)
champ_fill = (255, 245, 205)
muted = (105, 105, 105)

margin_top = 170
row_gap = 185
box_w, box_h = 335, 78

x_l16, x_l8, x_lqf, x_lsf = 80, 520, 890, 1205
x_rsf, x_rqf, x_r8, x_r16 = 1660, 1975, 2345, 2785

y16 = [margin_top + i * row_gap for i in range(8)]
y8 = [(y16[i * 2] + y16[i * 2 + 1]) / 2 for i in range(4)]
yqf = [(y8[i * 2] + y8[i * 2 + 1]) / 2 for i in range(2)]
ysf = [(yqf[0] + yqf[1]) / 2]

def draw_match(x, y_center, match, fill=box):
    num, a, b, win = match
    y = int(y_center - box_h / 2)

    draw.rounded_rectangle(
        [x, y, x + box_w, y + box_h],
        radius=12,
        fill=fill,
        outline=line,
        width=2,
    )

    draw.text((x + 10, y + 8), f"P{num}", font=small_bold, fill=muted)

    ax = x + 76
    y1, y2 = y + 8, y + 42
    max_team_width = box_w - 118

    a_bold = a == win
    b_bold = b == win
    draw.text(
        (ax, y1),
        a,
        font=fitted_font(a, 28 if a_bold else 27, a_bold, max_team_width),
        fill=(0, 0, 0),
    )
    draw.text(
        (ax, y2),
        b,
        font=fitted_font(b, 28 if b_bold else 27, b_bold, max_team_width),
        fill=(0, 0, 0),
    )

    wy = y1 if a == win else y2
    draw_winner_mark(x + box_w - 21, wy + 16)

    return (x, y, x + box_w, y + box_h)

def draw_winner_mark(cx, cy):
    draw.ellipse([cx - 7, cy - 7, cx + 7, cy + 7], fill=(40, 140, 70))

def connector_left(from_box, to_box, width=3):
    x1 = from_box[2]
    y1 = (from_box[1] + from_box[3]) / 2
    x2 = to_box[0]
    y2 = (to_box[1] + to_box[3]) / 2
    xm = (x1 + x2) / 2
    draw.line([(x1, y1), (xm, y1), (xm, y2), (x2, y2)], fill=line, width=width)

def connector_right(from_box, to_box, width=3):
    x1 = from_box[0]
    y1 = (from_box[1] + from_box[3]) / 2
    x2 = to_box[2]
    y2 = (to_box[1] + to_box[3]) / 2
    xm = (x1 + x2) / 2
    draw.line([(x1, y1), (xm, y1), (xm, y2), (x2, y2)], fill=line, width=width)

draw.text(
    (W // 2, 55),
    f"PORRA {args.nombre.upper()} MUNDIAL 2026 · CUADRO FINAL"
    if args.nombre
    else "PORRA MUNDIAL 2026 · CUADRO FINAL",
    font=title_font,
    anchor="mm",
    fill=(0, 0, 0),
)
draw.text(
    (W // 2, 112),
    "Dieciseisavos → Octavos → Cuartos → Semifinales → Final",
    font=header_font,
    anchor="mm",
    fill=muted,
)

for x, label in [
    (x_l16, "DIECISEISAVOS"),
    (x_l8, "OCTAVOS"),
    (x_lqf, "CUARTOS"),
    (x_lsf, "SEMIFINAL"),
]:
    draw.text((x + box_w / 2, 145), label, font=header_font, anchor="mm", fill=(0, 0, 0))

for x, label in [
    (x_rsf, "SEMIFINAL"),
    (x_rqf, "CUARTOS"),
    (x_r8, "OCTAVOS"),
    (x_r16, "DIECISEISAVOS"),
]:
    draw.text((x + box_w / 2, 145), label, font=header_font, anchor="mm", fill=(0, 0, 0))

left16_boxes = [draw_match(x_l16, y16[i], m) for i, m in enumerate(left_r16)]
left8_boxes = [draw_match(x_l8, y8[i], m) for i, m in enumerate(left_r8)]
leftqf_boxes = [draw_match(x_lqf, yqf[i], m) for i, m in enumerate(left_qf)]
leftsf_boxes = [draw_match(x_lsf, ysf[i], m, fill=winner_fill) for i, m in enumerate(left_sf)]

for i in range(4):
    connector_left(left16_boxes[2 * i], left8_boxes[i])
    connector_left(left16_boxes[2 * i + 1], left8_boxes[i])

for i in range(2):
    connector_left(left8_boxes[2 * i], leftqf_boxes[i])
    connector_left(left8_boxes[2 * i + 1], leftqf_boxes[i])

connector_left(leftqf_boxes[0], leftsf_boxes[0])
connector_left(leftqf_boxes[1], leftsf_boxes[0])

right16_boxes = [draw_match(x_r16, y16[i], m) for i, m in enumerate(right_r16)]
right8_boxes = [draw_match(x_r8, y8[i], m) for i, m in enumerate(right_r8)]
rightqf_boxes = [draw_match(x_rqf, yqf[i], m) for i, m in enumerate(right_qf)]
rightsf_boxes = [draw_match(x_rsf, ysf[i], m, fill=winner_fill) for i, m in enumerate(right_sf)]

for i in range(4):
    connector_right(right16_boxes[2 * i], right8_boxes[i])
    connector_right(right16_boxes[2 * i + 1], right8_boxes[i])

for i in range(2):
    connector_right(right8_boxes[2 * i], rightqf_boxes[i])
    connector_right(right8_boxes[2 * i + 1], rightqf_boxes[i])

connector_right(rightqf_boxes[0], rightsf_boxes[0])
connector_right(rightqf_boxes[1], rightsf_boxes[0])

final_w, final_h = 500, 115
final_x = W // 2 - final_w // 2
final_y = int(ysf[0] + 210)

draw.text((W // 2, final_y - 35), "FINAL", font=header_font, anchor="mm", fill=(0, 0, 0))

draw.rounded_rectangle(
    [final_x, final_y, final_x + final_w, final_y + final_h],
    radius=18,
    fill=champ_fill,
    outline=line,
    width=3,
)

draw.text((final_x + 18, final_y + 14), f"P{final[0]}", font=small_bold, fill=muted)
draw.text(
    (final_x + 110, final_y + 20),
    final[1],
    font=team_bold if final[1] == final[3] else team_font,
    fill=(0, 0, 0),
)
draw.text(
    (final_x + 110, final_y + 66),
    final[2],
    font=team_bold if final[2] == final[3] else team_font,
    fill=(0, 0, 0),
)
final_check_y = final_y + 21 if final[1] == final[3] else final_y + 67
draw_winner_mark(final_x + final_w - 33, final_check_y + 16)

left_sf_box = leftsf_boxes[0]
right_sf_box = rightsf_boxes[0]

left_start = (left_sf_box[2], (left_sf_box[1] + left_sf_box[3]) / 2)
right_start = (right_sf_box[0], (right_sf_box[1] + right_sf_box[3]) / 2)

final_left_mid = (final_x, final_y + final_h / 2)
final_right_mid = (final_x + final_w, final_y + final_h / 2)

mid_y = final_y + final_h / 2

draw.line(
    [left_start, (final_x - 80, left_start[1]), (final_x - 80, mid_y), final_left_mid],
    fill=line,
    width=4,
)
draw.line(
    [right_start, (final_x + final_w + 80, right_start[1]), (final_x + final_w + 80, mid_y), final_right_mid],
    fill=line,
    width=4,
)

banner_y = final_y + final_h + 65

draw.rounded_rectangle(
    [W // 2 - 420, banner_y, W // 2 + 420, banner_y + 90],
    radius=22,
    fill=(255, 250, 225),
    outline=line,
    width=2,
)

draw.text(
    (W // 2, banner_y + 45),
    f"Campeón: {final[3]}",
    font=champ_font,
    anchor="mm",
    fill=(0, 0, 0),
)

png_path = f"{args.prefix}.png"
pdf_path = f"{args.prefix}.pdf"

img.save(png_path, quality=95)
img.save(pdf_path, "PDF", resolution=200.0)

print(f"Generado: {png_path}")
print(f"Generado: {pdf_path}")
