// Native PowerPoint vector icons composed from MS preset shapes.
// Zero external dependencies. drawIcon(pres, slide, name, x, y, s, color)
// draws a clean icon inside an s×s box at (x, y) in the given hex color.

function makeDrawer(pres) {
  return function drawIcon(slide, name, X, Y, S, color) {
    const fill = { color };
    const noLine = { type: "none" };
    const W = S * 0.09; // standard stroke weight

    // place a filled preset shape using fractional coords (0..1) of the box
    const F = (shape, fx, fy, fw, fh, extra = {}) =>
      slide.addShape(shape, {
        x: X + fx * S, y: Y + fy * S, w: fw * S, h: fh * S,
        fill, line: noLine, ...extra,
      });
    // stroked ring/line via donut/ellipse outline replaced by filled donut
    const ring = (fx, fy, d) => F("donut", fx, fy, d, d);
    // thin bar (filled rect) from fractions, optional rotate
    const bar = (fx, fy, fw, fh, rotate = 0) =>
      slide.addShape("rect", {
        x: X + fx * S, y: Y + fy * S, w: fw * S, h: fh * S,
        fill, line: noLine, rotate,
      });

    switch (name) {
      case "scale": { // scales of justice
        F("rect", 0.47, 0.12, 0.06, 0.76);            // post
        F("rect", 0.18, 0.16, 0.64, 0.05);            // beam
        F("ellipse", 0.44, 0.07, 0.12, 0.1);          // fulcrum
        F("rect", 0.30, 0.80, 0.40, 0.06);            // base
        // pans
        F("ellipse", 0.10, 0.40, 0.22, 0.07);
        F("ellipse", 0.68, 0.40, 0.22, 0.07);
        bar(0.205, 0.18, 0.012, 0.26);                // left hanger
        bar(0.785, 0.18, 0.012, 0.26);                // right hanger
        break;
      }
      case "briefcase": {
        F("roundRect", 0.12, 0.30, 0.76, 0.52, { rectRadius: S * 0.05 });
        F("roundRect", 0.37, 0.16, 0.26, 0.16, { rectRadius: S * 0.03 });
        F("rect", 0.12, 0.48, 0.76, 0.07);
        break;
      }
      case "warning": {
        F("triangle", 0.06, 0.12, 0.88, 0.76);
        bar(0.47, 0.34, 0.06, 0.26);                  // exclamation stem
        F("ellipse", 0.46, 0.66, 0.08, 0.08);         // dot
        break;
      }
      case "layers": {
        F("diamond", 0.12, 0.10, 0.76, 0.34);
        F("diamond", 0.12, 0.33, 0.76, 0.34, { fill: { color, transparency: 35 } });
        F("diamond", 0.12, 0.56, 0.76, 0.34, { fill: { color, transparency: 60 } });
        break;
      }
      case "gear": { F("gear6", 0.06, 0.06, 0.88, 0.88); F("ellipse", 0.37, 0.37, 0.26, 0.26, { fill: { color, transparency: 100 }, line: { color: "FFFFFF", width: 1 } }); break; }
      case "gauge": {
        F("blockArc", 0.08, 0.12, 0.84, 0.84);
        bar(0.49, 0.30, 0.04, 0.28, -35);             // needle
        F("ellipse", 0.42, 0.5, 0.16, 0.16);          // hub
        break;
      }
      case "rocket": {
        F("teardrop", 0.36, 0.08, 0.28, 0.5, { rotate: 180 }); // body+nose
        F("triangle", 0.18, 0.5, 0.18, 0.26, { rotate: -25 }); // left fin
        F("triangle", 0.64, 0.5, 0.18, 0.26, { rotate: 25 });  // right fin
        F("ellipse", 0.44, 0.26, 0.12, 0.12, { fill: { color: "FFFFFF" } }); // window
        F("triangle", 0.42, 0.74, 0.16, 0.16);        // flame
        break;
      }
      case "check": {
        bar(0.16, 0.46, 0.09, 0.30, 45);
        bar(0.40, 0.30, 0.09, 0.52, -45);
        break;
      }
      case "folder": { F("folderCorner", 0.08, 0.18, 0.84, 0.64); break; }
      case "file": {
        F("rect", 0.20, 0.10, 0.60, 0.80);
        F("triangle", 0.62, 0.10, 0.18, 0.18, { fill: { color: "FFFFFF" }, rotate: 90 });
        F("rect", 0.30, 0.40, 0.40, 0.05, { fill: { color: "FFFFFF" } });
        F("rect", 0.30, 0.55, 0.40, 0.05, { fill: { color: "FFFFFF" } });
        F("rect", 0.30, 0.70, 0.26, 0.05, { fill: { color: "FFFFFF" } });
        break;
      }
      case "users": {
        F("ellipse", 0.10, 0.18, 0.26, 0.26);         // head 1
        F("roundRect", 0.04, 0.5, 0.38, 0.34, { rectRadius: S * 0.06 });
        F("ellipse", 0.58, 0.14, 0.30, 0.30);         // head 2
        F("roundRect", 0.5, 0.48, 0.46, 0.40, { rectRadius: S * 0.07 });
        break;
      }
      case "user": {
        F("ellipse", 0.32, 0.12, 0.36, 0.36);
        F("roundRect", 0.20, 0.54, 0.60, 0.42, { rectRadius: S * 0.1 });
        break;
      }
      case "robot": {
        F("roundRect", 0.16, 0.26, 0.68, 0.56, { rectRadius: S * 0.08 });
        F("ellipse", 0.31, 0.42, 0.14, 0.14, { fill: { color: "FFFFFF" } });
        F("ellipse", 0.55, 0.42, 0.14, 0.14, { fill: { color: "FFFFFF" } });
        bar(0.48, 0.10, 0.04, 0.16);                  // antenna
        F("ellipse", 0.44, 0.04, 0.12, 0.12);         // antenna ball
        break;
      }
      case "bell": {
        F("ellipse", 0.24, 0.18, 0.52, 0.52);
        F("rect", 0.24, 0.5, 0.52, 0.22);
        F("rect", 0.16, 0.68, 0.68, 0.07);            // rim
        F("ellipse", 0.43, 0.78, 0.14, 0.12);         // clapper
        F("rect", 0.46, 0.10, 0.08, 0.10);            // top knob
        break;
      }
      case "search": {
        F("donut", 0.12, 0.12, 0.56, 0.56);
        bar(0.62, 0.66, 0.08, 0.26, -45);             // handle
        break;
      }
      case "calendar": {
        F("roundRect", 0.12, 0.18, 0.76, 0.70, { rectRadius: S * 0.05 });
        F("rect", 0.12, 0.30, 0.76, 0.07, { fill: { color: "FFFFFF" } });
        F("rect", 0.28, 0.10, 0.07, 0.16);            // ring left
        F("rect", 0.65, 0.10, 0.07, 0.16);            // ring right
        F("rect", 0.24, 0.46, 0.12, 0.1, { fill: { color: "FFFFFF" } });
        F("rect", 0.44, 0.46, 0.12, 0.1, { fill: { color: "FFFFFF" } });
        F("rect", 0.64, 0.46, 0.12, 0.1, { fill: { color: "FFFFFF" } });
        F("rect", 0.24, 0.64, 0.12, 0.1, { fill: { color: "FFFFFF" } });
        F("rect", 0.44, 0.64, 0.12, 0.1, { fill: { color: "FFFFFF" } });
        break;
      }
      case "shield": {
        F("pentagon", 0.16, 0.08, 0.68, 0.84, { rotate: 180 });
        bar(0.34, 0.46, 0.07, 0.18, 45);              // check
        bar(0.45, 0.34, 0.07, 0.34, -45);
        break;
      }
      case "sitemap": {
        F("roundRect", 0.38, 0.06, 0.24, 0.20, { rectRadius: S * 0.03 });
        F("roundRect", 0.06, 0.7, 0.24, 0.20, { rectRadius: S * 0.03 });
        F("roundRect", 0.38, 0.7, 0.24, 0.20, { rectRadius: S * 0.03 });
        F("roundRect", 0.70, 0.7, 0.24, 0.20, { rectRadius: S * 0.03 });
        bar(0.49, 0.26, 0.03, 0.18);                  // trunk
        F("rect", 0.18, 0.44, 0.66, 0.03);            // bus
        bar(0.18, 0.44, 0.03, 0.28);
        bar(0.49, 0.44, 0.03, 0.28);
        bar(0.80, 0.44, 0.03, 0.28);
        break;
      }
      case "database": {
        F("can", 0.18, 0.10, 0.64, 0.80);
        F("ellipse", 0.18, 0.42, 0.64, 0.16, { fill: { color: "FFFFFF" } });
        F("ellipse", 0.18, 0.62, 0.64, 0.16, { fill: { color: "FFFFFF" } });
        break;
      }
      case "server": {
        F("roundRect", 0.12, 0.16, 0.76, 0.28, { rectRadius: S * 0.03 });
        F("roundRect", 0.12, 0.54, 0.76, 0.28, { rectRadius: S * 0.03 });
        F("ellipse", 0.20, 0.26, 0.09, 0.09, { fill: { color: "FFFFFF" } });
        F("ellipse", 0.20, 0.64, 0.09, 0.09, { fill: { color: "FFFFFF" } });
        break;
      }
      case "cloud": { F("cloud", 0.04, 0.18, 0.92, 0.64); break; }
      case "bolt": { F("lightningBolt", 0.28, 0.06, 0.44, 0.88); break; }
      case "hexagon": { F("hexagon", 0.08, 0.14, 0.84, 0.72); break; }
      case "code": {
        bar(0.30, 0.30, 0.07, 0.26, 55);              // <
        bar(0.30, 0.46, 0.07, 0.26, -55);
        bar(0.66, 0.30, 0.07, 0.26, -55);             // >
        bar(0.66, 0.46, 0.07, 0.26, 55);
        break;
      }
      case "key": {
        F("donut", 0.10, 0.30, 0.40, 0.40);
        F("rect", 0.46, 0.46, 0.42, 0.08);            // shaft
        F("rect", 0.78, 0.46, 0.06, 0.18);            // tooth
        F("rect", 0.66, 0.46, 0.06, 0.14);
        break;
      }
      case "workflow": {
        F("roundRect", 0.06, 0.10, 0.26, 0.22, { rectRadius: S * 0.03 });
        F("roundRect", 0.68, 0.39, 0.26, 0.22, { rectRadius: S * 0.03 });
        F("roundRect", 0.06, 0.68, 0.26, 0.22, { rectRadius: S * 0.03 });
        F("rect", 0.30, 0.20, 0.42, 0.03);
        bar(0.70, 0.21, 0.03, 0.20);
        F("rect", 0.30, 0.78, 0.42, 0.03);
        bar(0.70, 0.59, 0.03, 0.21);
        break;
      }
      case "eye": {
        F("ellipse", 0.08, 0.30, 0.84, 0.40);
        F("ellipse", 0.36, 0.30, 0.28, 0.40, { fill: { color: "FFFFFF" } });
        F("ellipse", 0.42, 0.38, 0.16, 0.24);
        break;
      }
      case "cube": { F("cube", 0.12, 0.10, 0.72, 0.80); break; }
      case "comments": {
        F("roundRect", 0.10, 0.14, 0.80, 0.54, { rectRadius: S * 0.1 });
        F("triangle", 0.24, 0.62, 0.22, 0.22, { rotate: 200 });
        F("ellipse", 0.26, 0.36, 0.1, 0.1, { fill: { color: "FFFFFF" } });
        F("ellipse", 0.45, 0.36, 0.1, 0.1, { fill: { color: "FFFFFF" } });
        F("ellipse", 0.64, 0.36, 0.1, 0.1, { fill: { color: "FFFFFF" } });
        break;
      }
      case "arrowRight": { F("rightArrow", 0.06, 0.30, 0.88, 0.40); break; }
      case "envelope": {
        F("roundRect", 0.10, 0.24, 0.80, 0.52, { rectRadius: S * 0.03 });
        F("triangle", 0.10, 0.24, 0.80, 0.40, { rotate: 180, fill: { color: "FFFFFF" } });
        F("triangle", 0.16, 0.28, 0.68, 0.32, { rotate: 180 });
        break;
      }
      case "clock": {
        F("donut", 0.08, 0.08, 0.84, 0.84);
        bar(0.485, 0.30, 0.04, 0.22);                 // hour hand
        bar(0.49, 0.46, 0.16, 0.035);                 // minute hand
        break;
      }
      case "wifi": {
        F("chevron", 0.18, 0.16, 0.64, 0.26, { rotate: 180 });
        F("chevron", 0.30, 0.38, 0.40, 0.20, { rotate: 180 });
        F("ellipse", 0.43, 0.66, 0.14, 0.14);
        break;
      }
      case "sparkles": {
        F("star5", 0.22, 0.10, 0.4, 0.4);
        F("star5", 0.52, 0.46, 0.34, 0.34);
        break;
      }
      case "star": { F("star5", 0.08, 0.08, 0.84, 0.84); break; }
      case "lock": {
        F("roundRect", 0.18, 0.42, 0.64, 0.48, { rectRadius: S * 0.06 });
        F("blockArc", 0.26, 0.10, 0.48, 0.56);        // shackle
        F("ellipse", 0.43, 0.58, 0.14, 0.14, { fill: { color: "FFFFFF" } });
        break;
      }
      case "rocket2":
      default: { F("ellipse", 0.2, 0.2, 0.6, 0.6); break; }
    }
  };
}

module.exports = { makeDrawer };
