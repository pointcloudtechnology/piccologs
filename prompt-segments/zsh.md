# Setup piccologs as ZSH prompt segment

## Requirements

- Zsh
- `jq` (install via `apt`, `pacman`, `dnf`)
- Install `piccologs` globally (`pnpm add -g @pointcloudtechnology/piccologs`)
- (Optionally) Install a [nerd font](https://www.nerdfonts.com/) for your terminal to display icons.

## Config snippet

Add the following snippet to your `.zshrc` config.

```zsh
# piccologs prompt segment
_piccologs_segment() {
  emulate -L zsh

  [[ -d $PWD/.piccologs ]] || return

  local json
  json=$(picco status --json 2>/dev/null) || return
  [[ -n $json ]] || return

  local n1 n2
  n1=$(jq -r '.newLogs   // 0' <<<$json 2>/dev/null) || return
  n2=$(jq -r '.applicableMigrations // 0' <<<$json 2>/dev/null) || return
  [[ $n1 == <-> && $n2 == <-> ]] || return

  local c1 c2
  (( n1 == 0 )) && c1=green || c1=blue
  (( n2 == 0 )) && c2=green || c2=yellow

  local icon1='' icon2='󱌣'

  print -rn -- "%F{$c1}${icon1} ${n1}%f %F{$c2}${icon2} ${n2}%f "
}
```

Enable it by adding it to the `PS1` variable

```zsh
setopt prompt_subst
PS1='$(_piccologs_segment)%n@%m:%~%# '
```

Lastly, restart your terminal.

## Troubleshooting

### Icons are not showing up correctly

Make sure you installed and set up a nerd font for your terminal. If the icons are still not showing up as expected,
you can simply replace the `icon1` and `icon2` variable with anything you like, e.g., use `local icon1='N' icon2='A'`
to display an `N` next to the number of new piccologs and an `A` next to the number of applicable migrations.
