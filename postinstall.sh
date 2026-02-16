if [ "$(expr substr $(uname -s) 1 5)" != "Linux" ]; then
  sed_mac_arg=true
fi

search_string="const ret = new Function(getStringFromWasm0(arg0, arg1));"
replace_string="console.log(getStringFromWasm0(arg0, arg1));\n    const ret = function() {\n        return typeof this === 'undefined' ? globalThis : this;\n    };"
sed -i ${sed_mac_arg:+""} "s/$search_string/$replace_string/" node_modules/@airgap/sapling-wasm/dist/index.browser.js
