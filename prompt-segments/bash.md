# Setup piccologs as Bash prompt segment

## Requirements

- Bash
- `jq` (install via `apt`, `pacman`, `dnf`)
- Install `piccologs` globally (`pnpm add -g @pointcloudtechnology/piccologs`)
- (Optionally) Install a [nerd font](https://www.nerdfonts.com/) for your terminal to display icons.

## Config snippet

Add the following snippet to your `.bashrc` config.

```bash
# piccologs prompt segment
_piccologs_segment() {
  [[ -d "$PWD/.piccologs" ]] || return

  local json
  json=$(picco status --json 2>/dev/null) || return
  [[ -n "$json" ]] || return

  local n1 n2
  n1=$(jq -r '.newLogs   // 0' <<<"$json" 2>/dev/null) || return
  n2=$(jq -r '.applicableMigrations // 0' <<<"$json" 2>/dev/null) || return

  [[ "$n1" =~ ^[0-9]+$ && "$n2" =~ ^[0-9]+$ ]] || return

  local reset=$'\001\033[0m\002'
  local green=$'\001\033[32m\002'
  local blue=$'\001\033[34m\002'
  local yellow=$'\001\033[33m\002'

  local c1 c2
  (( n1 == 0 )) && c1=$green || c1=$blue
  (( n2 == 0 )) && c2=$green || c2=$yellow

  local icon1='' icon2='󱌣'

  printf '%s%s %s%s %s%s %s%s ' \
    "$c1" "$icon1" "$n1" "$reset" \
    "$c2" "$icon2" "$n2" "$reset"
}
```

Enable it by adding it to the `PS1` variable

```bash
PS1='$(_piccologs_segment)\u@\h:\w\$ '
```

Lastly, restart your terminal.

## Troubleshooting

### Icons are not showing up correctly

Make sure you installed and set up a nerd font for your terminal. If the icons are still not showing up as expected,
you can simply replace the `icon1` and `icon2` variable with anything you like, e.g., use `local icon1='N' icon2='A'`
to display an `N` next to the number of new piccologs and an `A` next to the number of applicable migrations.
