document.addEventListener('DOMContentLoaded', function() {
    console.log("Python Code Runner initialized - ready to start.");
    
    async function getPyodide() {
        try {
            const module = await import("https://esm.sh/pyodide@0.24.1");
            return module.loadPyodide;
        } catch (err) {
            const module = await import("https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.mjs");
            return module.loadPyodide;
        }
    }
    let pyodide;
    async function initPyodide() {
        const loadPyodide = await getPyodide();
        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
        });
        document.getElementById('output').value = 'Pyodide loaded. Ready to execute Python code...';
        return pyodide;
    }
    async function runPython() {
        try {
            if (!pyodide) {
                document.getElementById('output').value = 'Initializing Pyodide...';
                await initPyodide();
            }
            document.getElementById('output').value = '';
            const code = document.getElementById('input').value;
            pyodide.runPython(`
                import sys
                from js import document
                class WebConsole:
                    def write(self, text):
                        element = document.getElementById('output')
                        element.value = element.value + text
                    def flush(self):
                        pass
                sys.stdout = WebConsole()
            `);
            
            let result = await pyodide.runPythonAsync(code);
            
            if (result !== undefined && result !== null) {
                document.getElementById('output').value += `\n${result.toString()}`;
            }
        } catch (err) {
            document.getElementById('output').value = `Error: ${err.message}`;
        }
    }
    async function installPackages() {
        console.log("Package installation started by user");
        try {
            if (!pyodide) {
                document.getElementById('output').value = 'Initializing Pyodide...';
                await initPyodide();
            }
            const packagesText = document.getElementById('modcollect').value.trim();
            if (!packagesText) {
                document.getElementById('output').value = 'No packages specified';
                return;
            }
            const packages = packagesText.split(/[\s,]+/).filter(pkg => pkg);
            document.getElementById('output').value = `Installing packages: ${packages.join(', ')}...`;
            await pyodide.loadPackage("micropip");
            const micropip = pyodide.pyimport("micropip");
            for (const pkg of packages) {
                try {
                    await micropip.install(pkg);
                    document.getElementById('output').value += `\nSuccessfully installed ${pkg}`;
                } catch (err) {
                    document.getElementById('output').value += `\nFailed to install ${pkg}: ${err.message}`;
                }
            }
            document.getElementById('output').value += '\nAll installations completed.';
        } catch (err) {
            document.getElementById('output').value = `Error during installation: ${err.message}`;
        }
    }

    // Add event listeners - only call functions when buttons are clicked
    document.getElementById('exe').addEventListener('click', runPython);
    document.getElementById('inst').addEventListener('click', installPackages);
});