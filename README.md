# piccologs

Simple CLI tool for generating changelogs; inspired by [changesets](https://github.com/changesets/changesets)

## Commands

### `picco init`

Initializes piccologs by creating a `.piccologs` directory in your current working directory.
Also adds a `.gitkeep` file to ensure that the directory is checked into version control.

### `picco add`

Asks you some questions about the change and adds the provided information in a new piccolog file.
You may edit the generated piccolog file in your preferred editor and check it into version control.

### `picco version`

Collects all piccologs and writes them nicely formatted to your `CHANGELOG.md` under a given version tag.
You may edit the updated `CHANGELOG.md` in your preferred editor and commit it to version control.

### `picco list`

#### (alias: `picco ls`)

Collects all piccologs and outputs them to the console. You can optionally use a `--type=<type>` argument to output only changes of a certain type, e.g.,

```shell
$ npx picco ls --type=migration
```
