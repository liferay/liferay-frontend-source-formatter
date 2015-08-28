check-source-formatting
=======================
[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
### Jump to Section

- [Description](#description)
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Sublime Text Integration](#sublime-text-integration)
- [Known issues](#known-issues)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Description

Runs common checks against your files to check for issues according to Liferay's formatting guidelines.

### What it checks
This will scan through HTML(-like) files, JS files, and CSS files and detect many common patterns or issues that violate our source formatting rules, such as:

#### CSS (.css and .scss)
- Properties being unalphabetized, such as `color: #FFF; border: 1px solid;`
- Longhand hex codes that can be shorthanded, such as `#FFFFFF`
- Unneeded units, such as `0px` or `0em`
- Missing integers, in cases such as `opacity: .4;`
- Lower or mixed case hex codes, such as `#fff`
- Mixed spaces and tabs
- Comma separated lists that are missing spaces, such as `rgb(0,0,0)`
- Trailing new lines in nested rules
- Misc. property formatting/spacing

#### HTML(-like) files, such as JSP, VM, FTL, etc
- Attributes that are unalphabetized, such as `<span id="test" class="foo">`
- Attribute values that are unalphabetized, such as `<span class="lfr-foo hide">`

#### JavaScript
- Mixed spaces and tabs
- Double quoted strings that should be single quoted
- Stray debugging calls, such as `console.log`, `console.info`, etc
- Functions that are improperly formatted, such as `function (`
- Function arguments that are improperly formatted, such as `.on('foo', function(event) {`
- Invalid bracket placement, such as `){` or `} else {`
- Properties or methods that are non-alphabetically listed
- Trailing commas in arrays and objects
- Variables that are all defined in one statement
- Variables being passed to `Liferay.Language.get()`
- Trailing or extraneous newlines
- Variable names starting with `is` (it ignores methods, which is valid, but properties and variables should not have a prefix of `is`)
- **Experimental** Will try to parse JavaScript inside of <aui:script> blocks

## Installation

```
<sudo> npm install -g check-source-formatting
```

## Usage

The simplest way to run it is:

```
check_sf path/to/file
```

However, you can also check multiple files at once:

```
find . -name '*.css' | xargs check_sf
```

I find it easier to use it with pull requests and check the files that were changed on the branch.
In my .gitconfig I have:

```
sfm = "!f() { git diff --stat --name-only master.. | grep -E '.(jsp.?|vm|ftl|tag|tpl|tmpl|js|soy|hbs|(s)?css)$' | tr \"\\n\" \"\\0\" | xargs -0 -J{} check_sf {} $@; }; f"
```

(You could get rid of the grep portion, but I find it easier to just filter them out on this level).

When someone sends me a pull request, I check out the branch and run `git sfm` and it scans the changed files and reports any issues.

## Options

There are some options that you can pass to the command:

`-q, --quiet` will set it so that it only shows files that have errors. By default it will log out all files and report 'clear' if there are no errors.

`-o, --open` If you have an editor specified in your gitconfig (under user.editor), this will open all of the files that have errors in your editor.

`-i, --inline-edit` For some of the errors (mainly the ones that can be safely changed), if you pass this option, it will modify the file and convert the error to a valid value.

`-l, --lint` If you don't pass anything, `--lint` defaults to true, which switches on the linting of the JavaScript.

If you pass `--no-lint` it will overwrite the default and disable linting.

`--junit [pathToFile]` If you wish to output the results of the scan to a JUnit compatible XML file (useful for allowing integration servers to automate the check and output the results).
    If you don't pass the path to the file, it will default to "result.xml".

`--filenames` Print only the file names of the files that have errors (this option implies `--quiet`). This is useful if you wish to pipe the list of files to other commands.

`--f, --force` Formatters can choose to ignore certain files (for example, the JS formatter ignores files that end with `-min.js`). If you want to force the formatter to run on that file, pass this option.

### Experimental or less used options

`-r, --relative` This will display the files passed in as relative to you current directory.
This is mainly useful when you want to show the file name relative to your current working directory.
I use it mainly when I'm running this on a git branch. In order for it to work from your alias, you would need to change the above alias to be:
```
sfm = "!f() { export GIT_PWD=\"$GIT_PREFIX\"; git diff --stat --name-only master.. | grep -E '.(jsp.?|vm|ftl|tag|tpl|tmpl|js|(s)?css)$' | xargs check_sf $@; }; f"
```

`-v, --verbose` This will log out any possible error, even ones that are probably a false positive.
Currently, there's only one testable case of this, which is where you have something like this:
```
<span class="lfr-foo"><liferay-ui:message key="hello-world" /></span>
```
This will say there's an error (that the attributes are out of order), but since we can tell there's a `><` between the attributes, we know that it's more than likely not a real error.

However, passing -v will show these errors (marked with a **).

`--color`, `--no-color` If you don't pass anything, `--color` defaults to true, which colors the output for the terminal. However, there may be times you need to pass the output of the script to other scripts, and want to have the output in a plain text format.

If you pass `--no-color` it will overwrite the default and give you plain text.

`--lint-ids` Previously, all errors that were generated by ESLint included their rule ID in the error message. This is no longer true by default (as it adds a lot of noise), but you can turn it on by adding this option.

`-m`, `--check-metadata` If we're inside of a portal repository, and one of the files is in the /html/js/liferay/ directory, check all of the modules in that directory, and see if the requires metadata in the files matches the metadata in the modules.js file.

`--show-columns` If this is passed, it will show the column where the error has taken place. At this time, it only works on JavaScript, since ESLint will give us column information, but I may work something out for this in the future. This one is added mainly for Sublime Linter and other scripts that may wish use the information. It defaults to false, since it's not super useful in regular usage (at least I haven't found it to be).

If you pass `-v`, it will give you the lines in each file, as well as a merged version (useful for copy/pasting to update the metadata).

## Sublime Text Integration
There are now two ways you can integrate this module with Sublime Text:

### As a build system
You can setup a build system in Sublime Text to run the formatter on the file you are working in, and this is the simplest of the options.
You can set up your build system using the following steps:
- Go to the menu labeled Tools > Build System > New Build System
- Use the following code for the new build system and save the file
```
{
	"shell_cmd": "check_sf $file"
}
```
- Go to Tools > Build System and select the system you created

And that's it. When you build the file (Tools > Build) the result will be shown in the Sublime Text command line. You can also install [SublimeOnSaveBuild](https://packagecontrol.io/packages/SublimeOnSaveBuild) plugin via [Package Control](https://packagecontrol.io/) to automatically build the file when you save it.
Thanks to [Carlos Lancha](https://github.com/carloslancha) for the idea and docs.

### As a Sublime Linter plugin
You can also use [Sublime Linter](http://www.sublimelinter.com/en/latest/) to visually see in your code where the errors are:
[![Sublime Linter](/../screenshots/images/sublime_linter.png?raw=true "Sublime Linter")](https://packagecontrol.io/packages/SublimeLinter-contrib-check-source-formatting)

You can install it via a couple of steps:
- Install [Sublime Linter](http://www.sublimelinter.com/en/latest/) via Package Control
- Install the [SublimeLinter-contrib-check-source-formatting](https://packagecontrol.io/packages/SublimeLinter-contrib-check-source-formatting) package via Package Control
- In order to get it to lint, you may need to either manually lint it (in the Command Palette, type "Lint this view" and select it), or you may wish to change when it lints (in the Command Palette again, type "Choose Lint Mode", and select when you want it to lint the file).

You can read more on [the project page](https://packagecontrol.io/packages/SublimeLinter-contrib-check-source-formatting).
Thanks to [Drew Brokke](https://github.com/drewbrokke) for writing the plugin and publishing it.

## Known issues
The following are known issues where it will say there's an error, but there's not (or where there should be an error but there's not)

- If you have multiple tags on one line, but separated by spaces, like the following:
```
<span class="lfr-foo">(<liferay-ui:message key="hello-world" />)</span>
```
then it will still flag that as an error
- Spaces inside of JS comments will most of the time get flagged as mixed tabs and spaces
- Double quotes inside of JS (like inside of a regex or in a comment), will get flagged as an error.

[npm-image]: https://img.shields.io/npm/v/check-source-formatting.svg?style=flat-square
[npm-url]: https://npmjs.org/package/check-source-formatting
[travis-image]: https://img.shields.io/travis/natecavanaugh/check-source-formatting/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/natecavanaugh/check-source-formatting
[coveralls-image]: https://img.shields.io/coveralls/natecavanaugh/check-source-formatting/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/natecavanaugh/check-source-formatting?branch=master