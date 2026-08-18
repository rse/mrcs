/*
**  MRCS -- Multi-Ramp Coloring Scheme
**  Copyright (c) 2026 Dr. Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*  external dependencies  */
import { converter, clampChroma, formatHex } from "culori"

/*  color ramp specification (with all defaults resolved)  */
export type MRCSSpec = {
    rgb:     string,
    floor:   number,
    ceiling: number,
    count:   number
}

/*  generation constants  */
const greyChroma    = 0.01  /*  OKLCH chroma below which a color counts as plain grey  */
const greyFloor     = 0     /*  lightness floor   of a plain grey color (in percent)   */
const greyCeiling   = 0     /*  lightness ceiling of a plain grey color (in percent)   */
const colorFloor    = 20    /*  lightness floor   of a chromatic color (in percent)    */
const colorCeiling  = 10    /*  lightness ceiling of a chromatic color (in percent)    */
const defaultCount  = 9     /*  number of colors in a ramp                             */

/*  color space converter  */
const toOKLCH = converter("oklch")

/*  parse a color ramp specification "<rgb>[^][+<floor>][-<ceiling>][/<count>]"  */
export function parse (spec: string): MRCSSpec {
    const m = spec.match(/^(.+?)(\^)?(?:\+(\d+(?:\.\d+)?))?(?:-(\d+(?:\.\d+)?))?(?:\/(\d+))?$/)
    if (m === null)
        throw new Error(`invalid color ramp specification "${spec}"`)
    const [ , rgb, complement, floor, ceiling, count ] = m
    const oklch = toOKLCH(rgb)
    if (oklch === undefined)
        throw new Error(`invalid color "${rgb}"`)

    /*  a plain grey color spans the entire lightness range,
        while a chromatic color stays off both of its ends  */
    const grey = oklch.c < greyChroma

    /*  optionally transpose the base color into its complement,
        i.e. rotate its hue by 180 degrees on the color wheel  */
    const base = complement ?
        formatHex(clampChroma({ ...oklch, h: ((oklch.h ?? 0) + 180) % 360 }, "oklch")) :
        rgb

    const result: MRCSSpec = {
        rgb: base,
        floor:   floor   ? parseFloat(floor)   : (grey ? greyFloor   : colorFloor),
        ceiling: ceiling ? parseFloat(ceiling) : (grey ? greyCeiling : colorCeiling),
        count:   count   ? parseInt(count)     : defaultCount
    }
    if (result.floor < 0 || result.ceiling < 0 || (result.floor + result.ceiling) >= 100)
        throw new Error(`invalid lightness range in specification "${spec}"`)
    if (result.count < 1)
        throw new Error(`invalid number of colors in specification "${spec}"`)
    return result
}

/*  format a color ramp specification back into its canonical
    string notation "<rgb>+<floor>-<ceiling>/<count>"  */
export function format (spec: MRCSSpec): string {
    const rgb = formatHex(spec.rgb)
    if (rgb === undefined)
        throw new Error(`invalid color "${spec.rgb}"`)
    return `${rgb}+${spec.floor}-${spec.ceiling}/${spec.count}`
}

/*  generate the color ramp of a color ramp specification  */
export function generate (spec: MRCSSpec): string[] {
    const oklch = toOKLCH(spec.rgb)
    if (oklch === undefined)
        throw new Error(`invalid color "${spec.rgb}"`)

    /*  sweep the lightness between the floor and the ceiling bound,
        while keeping chroma and hue fixed as the "tone" of the ramp  */
    const from = spec.floor / 100
    const to   = (100 - spec.ceiling) / 100
    const colors = [] as string[]
    for (let i = 0; i < spec.count; i++) {
        const l = spec.count > 1 ? from + ((to - from) * (i / (spec.count - 1))) : from

        /*  reduce the chroma just enough to re-enter the sRGB gamut,
            which leaves the lightness and the hue untouched  */
        colors.push(formatHex(clampChroma({ ...oklch, l }, "oklch")))
    }
    return colors
}

