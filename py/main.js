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
}

async function runPython() {
    try {
        if (!pyodide) {
            document.getElementById('output').value = 'Initializing Pyodide...';
            await initPyodide();
        }

        //document.getElementById('output').value = 'Running...';
      document.getElementById('output').value = '';

        const code = document.getElementById('input').value;

        // Redirect Python stdout
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
        
        // Only show return value if it exists and isn't None
        if (result !== undefined && result !== null) {
            document.getElementById('output').value = `${result.toString()}`; //concat
          document.getElementById('output').value = `Finished!`;
        }
    } catch (err) {
        document.getElementById('output').value = `Error: ${err.message}`;
    }
}
//add install support
async function installPackages() {
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

        // Split packages by whitespace or commas
        const packages = packagesText.split(/[\s,]+/).filter(pkg => pkg);

        document.getElementById('output').value = `Installing packages: ${packages.join(', ')}...`;

        // Import micropip
        await pyodide.loadPackage("micropip");
        const micropip = pyodide.pyimport("micropip");

        // Install each package
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

// Add event listener to execute button
document.getElementById('exe').addEventListener('click', runPython);
document.getElementById('inst').addEventListener('click', installPackages);

// Initialize Pyodide on load
initPyodide();

export { runPython };
