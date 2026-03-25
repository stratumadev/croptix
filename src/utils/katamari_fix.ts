;(() => {
    document.documentElement.setAttribute('cropix-katamari-fix', '1')

    function patch_webpack_chunk(chunk_data: any) {
        try {
            const modules = chunk_data[1]
            if (!modules) return

            for (const module_id in modules) {
                const fn = modules[module_id]
                if (typeof fn !== 'function') continue

                const fn_str = fn.toString()
                if (fn_str.includes('ENABLE_KATAMARI')) {
                    const fix_fn_str = fn_str.replace(/(\[[a-zA-Z0-9_$]+\.ENABLE_KATAMARI\]\s*:\s*\{\s*default\s*:\s*)\d+(\s*\})/g, '$10$2')

                    if (fix_fn_str !== fn_str) {
                        modules[module_id] = new Function('return ' + fix_fn_str)() as any
                        console.log('Katamari -> Vilos patch successful')
                    }
                }
            }
        } catch (err) {
            console.error('Katamari -> Vilos patch failed:', err)
        }
    }

    let chunk_array = (window as any).webpackChunk_N_E
    if (!chunk_array) {
        chunk_array = (window as any).webpackChunk_N_E = []
    }

    if (Array.isArray(chunk_array)) {
        chunk_array.forEach((chunk: any) => {
            if (Array.isArray(chunk) && chunk.length >= 2) {
                patch_webpack_chunk(chunk)
            }
        })
    }

    let is_patching = false
    let current_push = Array.prototype.push
    Object.defineProperty(chunk_array, 'push', {
        configurable: true,
        get() {
            return function (this: any, ...args: any[]) {
                if (is_patching) {
                    return Array.prototype.push.apply(this, args)
                }

                is_patching = true
                try {
                    for (const chunk_data of args) {
                        patch_webpack_chunk(chunk_data)
                    }
                    return current_push.apply(this, args as any)
                } finally {
                    is_patching = false
                }
            }
        },
        set(new_push: any) {
            current_push = new_push
        }
    })
})()
