
MRCS
====

**Multi-Ramp Coloring Scheme**

<p/>
<img src="https://nodei.co/npm/mrcs.png?downloads=true&stars=true" alt=""/>

Abstract
--------

**MRCS** (Multi-Ramp Coloring Scheme) is a simple and minimalistic color scheme
generator, designed by Dr. Ralf S. Engelschall. It expands a few base
colors into full color ramps for use in applications, websites, diagrams,
etc.

**MRCS** is based on the following foundational rules:

1. *Tone Preservation*:
   A base color is converted into the perceptually uniform **OKLCH**
   color space, where its chroma (C) and hue (H) are the *tone* of the
   color and are kept fixed for the entire ramp.

2. *Lightness Sweep*:
   Only the lightness (L) of **OKLCH** is swept, in equal steps, between
   a *floor* and a *ceiling* bound. Color 1 sits exactly at the floor
   bound and color N sits exactly at the ceiling bound.

3. *Grey Exception*:
   By default, a plain grey base color (OKLCH chroma below 0.01) spans
   the entire lightness range (L 0%...100%), while a chromatic base
   color stays off both of its ends (L 20%...90%), as a chromatic color
   degenerates towards black and white.

4. *Complement Transposition*:
   A base color optionally is transposed into its *complement* on the
   color wheel, by rotating its **OKLCH** hue by 180 degrees while
   keeping its lightness and chroma. A plain grey base color has no
   hue and hence is its own complement.

5. *Gamut Mapping*:
   As a fixed chroma is not reachable at every lightness, the chroma is
   reduced just enough to re-enter the sRGB gamut, which leaves the
   lightness and the hue of a color untouched.

Installation
------------

```sh
$ npm install [-g] mrcs
```

Usage
-----

**MRCS** can be used from the command-line via its CLI. Specify one or
more color ramp specifications of the format
`<name>:<rgb>[^][+<floor>][-<ceiling>][/<count>]`, where `<rgb>` is any
CSS color notation -- the short hex `#rgb`, the long hex `#rrggbb`, a
color name like `cornflowerblue`, or a functional notation like
`rgb(51, 102, 204)`, `hsl(220, 60%, 50%)`, or `oklch(53% 0.17 262)` --
`^` transposes the base color into its complement, `<floor>` is the
lower lightness bound in percent, `<ceiling>` is the *inset below white*
of the upper lightness bound in percent, and `<count>` is the number of
colors (default: 9). Choose an
output format (`css`, `root`, `json`, `yaml`, or `url`) and an optional
CSS variable name prefix:

```sh
$ mrcs --prefix mrcs --format root "grey:#808080/5" "blue:#3366cc/5"
:root {
    --mrcs-grey-1: #000000;
    --mrcs-grey-2: #222222;
    --mrcs-grey-3: #636363;
    --mrcs-grey-4: #aeaeae;
    --mrcs-grey-5: #ffffff;
    --mrcs-blue-1: #001040;
    --mrcs-blue-2: #053598;
    --mrcs-blue-3: #386bd2;
    --mrcs-blue-4: #75a4ff;
    --mrcs-blue-5: #cddfff;
}

$ mrcs --format yaml "blue:#3366cc/3" "blue-comp:#3366cc^/3"
blue:
    - "#001040"
    - "#386bd2"
    - "#cddfff"
blue-comp:
    - "#1f1400"
    - "#916a0c"
    - "#ffd891"
```

The entire color scheme can be collapsed into the compact URL notation
`mrcs:<spec>,<spec>[,...]`, which is accepted back as a single positional
argument. In this notation all defaults are resolved, the base color is
canonicalized to a hex color notation without its leading `#`, and the
complement transposition is already applied:

```sh
$ mrcs --format url "grey:#808080/5" "blue:#3366cc^"
mrcs:grey:808080+0-0/5,blue:8c6500+20-10/9

$ mrcs --format yaml "mrcs:grey:808080+0-0/5,blue:8c6500+20-10/9"
grey:
    - "#000000"
[...]
```

Alternatively, **MRCS** can be used programmatically via its
TypeScript/JavaScript API, which knows only the color ramp itself and
neither the name nor the prefix of a color:

```ts
import { parse, format, generate } from "mrcs"

/*  parse a color ramp specification (resolving all defaults)  */
const spec = parse("#3366cc")
/*  { rgb: "#3366cc", floor: 20, ceiling: 10, count: 9 }  */

/*  the "^" suffix transposes the base color into its complement  */
parse("#3366cc^")
/*  { rgb: "#8c6500", floor: 20, ceiling: 10, count: 9 }  */

/*  format a specification back into its canonical string notation  */
format(parse("#3366cc^"))
/*  "#8c6500+20-10/9"  */

/*  generate the color ramp of a specification  */
generate(parse("#3366cc/5"))
/*  [ "#001040", "#053598", "#386bd2", "#75a4ff", "#cddfff" ]  */

generate(parse("#808080/5"))
/*  [ "#000000", "#222222", "#636363", "#aeaeae", "#ffffff" ]  */
```

License
-------

Copyright &copy; 2026 Dr. Ralf S. Engelschall (http://engelschall.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

