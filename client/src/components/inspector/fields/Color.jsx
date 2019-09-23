import React, {Component} from 'react'

// Changes the RGB/HEX temporarily to a HSL-Value, modifies that value 
// and changes it back to RGB/HEX.

function changeHue(rgb, degree) {
    var hsl = rgbToHSL(rgb);
    hsl.h += degree;
    if (hsl.h > 360) {
        hsl.h -= 360;
    }
    else if (hsl.h < 0) {
        hsl.h += 360;
    }
    return hslToRGB(hsl);
}

// exepcts a string and returns an object
function rgbToHSL(rgb) {
    // strip the leading # if it's there
    rgb = rgb.replace(/^\s*#|\s*$/g, '');

    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
    if(rgb.length == 3){
        rgb = rgb.replace(/(.)/g, '$1$1');
    }

    var r = parseInt(rgb.substr(0, 2), 16) / 255,
        g = parseInt(rgb.substr(2, 2), 16) / 255,
        b = parseInt(rgb.substr(4, 2), 16) / 255,
        cMax = Math.max(r, g, b),
        cMin = Math.min(r, g, b),
        delta = cMax - cMin,
        l = (cMax + cMin) / 2,
        h = 0,
        s = 0;

    if (delta == 0) {
        h = 0;
    }
    else if (cMax == r) {
        h = 60 * (((g - b) / delta) % 6);
    }
    else if (cMax == g) {
        h = 60 * (((b - r) / delta) + 2);
    }
    else {
        h = 60 * (((r - g) / delta) + 4);
    }

    if (delta == 0) {
        s = 0;
    }
    else {
        s = (delta/(1-Math.abs(2*l - 1)))
    }

    return {
        h: h,
        s: s,
        l: l
    }
}

// expects an object and returns a string
function hslToRGB(hsl) {
    var h = hsl.h,
        s = hsl.s,
        l = hsl.l,
        c = (1 - Math.abs(2*l - 1)) * s,
        x = c * ( 1 - Math.abs((h / 60 ) % 2 - 1 )),
        m = l - c/ 2,
        r, g, b;

    if (h < 60) {
        r = c;
        g = x;
        b = 0;
    }
    else if (h < 120) {
        r = x;
        g = c;
        b = 0;
    }
    else if (h < 180) {
        r = 0;
        g = c;
        b = x;
    }
    else if (h < 240) {
        r = 0;
        g = x;
        b = c;
    }
    else if (h < 300) {
        r = x;
        g = 0;
        b = c;
    }
    else {
        r = c;
        g = 0;
        b = x;
    }

    r = normalize_rgb_value(r, m);
    g = normalize_rgb_value(g, m);
    b = normalize_rgb_value(b, m);

    return rgbToHex(r,g,b);
}

function normalize_rgb_value(color, m) {
    color = Math.floor((color + m) * 255);
    if (color < 0) {
        color = 0;
    }
    return color;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

let foreground = '#b4bdcb'
let background = '#242a33'
let farBackground = '#111924'
let highlight = '#333c4a'
let focus = '#a3c9ef'
let inactive = '#697a96'

class Color extends Component {
    render() {
        return (
            <div className="field">
                <style>
                {`:root {
                    --foreground: ${foreground};
                    --background: ${background};
                    --far-background: ${farBackground};
                    --highlight: ${highlight};
                    --focus: ${focus};
                    --inactive: ${inactive};
                }`}
                </style>
                <p className="field-title">{this.props.title}</p>
                <input
                    type="color"
                    value={this.props.value}
                    onChange={e => {
                        const hue = rgbToHSL(e.target.value).h
                        foreground = hslToRGB({
                            h: hue,
                            s: rgbToHSL('#b4bdcb').s,
                            l: rgbToHSL('#b4bdcb').l
                        })
                        background = hslToRGB({
                            h: hue,
                            s: rgbToHSL('#242a33').s,
                            l: rgbToHSL('#242a33').l
                        })
                        farBackground = hslToRGB({
                            h: hue,
                            s: rgbToHSL('#111924').s,
                            l: rgbToHSL('#111924').l
                        })
                        highlight = hslToRGB({
                            h: hue,
                            s: rgbToHSL('#333c4a').s,
                            l: rgbToHSL('#333c4a').l
                        })
                        focus = hslToRGB({
                            h: hue,
                            s: rgbToHSL('#a3c9ef').s,
                            l: rgbToHSL('#a3c9ef').l
                        })
                        inactive = hslToRGB({
                            h: hue,
                            s: rgbToHSL('#697a96').s,
                            l: rgbToHSL('#697a96').l
                        })
                        this.props.onChange(e.target.value)
                        this.forceUpdate()
                    }}
                    disabled={this.props.disabled} />
            </div>
        )
    }
}

export default Color
