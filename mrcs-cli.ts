#!/usr/bin/env node
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

/*  import dependencies  */
import { Command }                                from "commander"
import * as jsYAML                                from "js-yaml"
import { parse, format, generate, type MRCSSpec } from "./mrcs-api.js"

/*  parsed command-line options  */
type MRCSArgs = {
    prefix?: string,
    format:  string
}

/*  scheme prefix and detection pattern of the URL notation "mrcs:<spec>,<spec>[,...]",
    where the second colon of the first specification distinguishes the URL
    from a plain specification of a color ramp which is just named "mrcs"  */
const urlScheme  = "mrcs:"
const urlPattern = /^mrcs:[^:,]+:/

/*  expand the URL notation into its color ramp specifications  */
function parseURL (url: string): string[] {
    /*  split at the top-level commas only, as a functional color
        notation like "rgb(51,102,204)" carries commas itself  */
    return url.substring(urlScheme.length).split(/,(?![^(]*\))/).map((spec) =>
        /*  decode the percent-encoding and restore the leading "#"
            of a hex color, which the URL notation omits  */
        decodeURIComponent(spec).replace(/^([^:]+:)([0-9a-fA-F]{3,8})(?=[-+/]|$)/, "$1#$2"))
}

/*  collapse color ramp specifications into the URL notation  */
function formatURL (scheme: Map<string, MRCSSpec>): string {
    const specs = [] as string[]
    for (const [ name, spec ] of scheme)
        specs.push(`${encodeURIComponent(name)}:${format(spec).replace(/^#/, "")}`)
    return urlScheme + specs.join(",")
}

/*  establish environment  */
;(async () => {
    /*  parse command-line arguments  */
    const program = new Command()
        .name("mrcs")
        .usage("[<options>] <name>:<rgb>[^][+<floor>][-<ceiling>][/<count>] [...] | mrcs:<spec>[,...]")
        .option("-p, --prefix <prefix>", "prefix of generated CSS variable names")
        .option("-f, --format <format>", "output format ('css', 'root', 'json', 'yaml', 'url')", "css")
        .argument("<spec...>", "color ramp specifications or a single \"mrcs:\" URL")
        .showHelpAfterError()
        .parse()
    const args = program.opts<MRCSArgs>()

    /*  accept the specifications either as individual arguments
        or collapsed into a single URL notation argument  */
    const specs = program.args.length === 1 && urlPattern.test(program.args[0]) ?
        parseURL(program.args[0]) :
        program.args

    /*  parse every color ramp specification  */
    const scheme = new Map<string, MRCSSpec>()
    for (const spec of specs) {
        const m = spec.match(/^([^:]+):(.+)$/)
        if (m === null)
            throw new Error(`invalid color ramp specification "${spec}"`)
        scheme.set(m[1], parse(m[2]))
    }

    /*  generate the color ramp of every color ramp specification  */
    const ramps = new Map<string, string[]>()
    for (const [ name, spec ] of scheme)
        ramps.set(name, generate(spec))

    /*  output the color scheme  */
    if (args.format === "url")
        process.stdout.write(formatURL(scheme) + "\n")
    else if (args.format === "json")
        process.stdout.write(JSON.stringify(Object.fromEntries(ramps), null, "    ") + "\n")
    else if (args.format === "yaml")
        process.stdout.write(jsYAML.dump(Object.fromEntries(ramps), { indent: 4, flowLevel: 2, quoteStyle: "double" }))
    else if (args.format === "css" || args.format === "root") {
        let css = ""
        const prefix = args.prefix ? `${args.prefix}-` : ""
        for (const [ name, colors ] of ramps)
            for (let i = 0; i < colors.length; i++)
                css += `--${prefix}${name}-${i + 1}: ${colors[i]};\n`
        if (args.format === "root")
            css = ":root {\n" + css.replace(/^(.)/mg, "    $1") + "}\n"
        process.stdout.write(css)
    }
    else
        throw new Error("invalid output format")
})().catch((ex) => {
    process.stderr.write(`mrcs: ERROR: ${ex.toString()}\n`)
    process.exitCode = 1
})

