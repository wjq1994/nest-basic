# 笔记

[nestjs流程](#nestjs流程)

### nestjs流程

>npm run start

>@nestjs/cli/actions/build.action.js

runBuild

>@nestjs/cli/lib/compiler/compiler.js

```javascript
    run(configuration, configFilename, appName, onSuccess) {
        const tsBinary = this.typescriptLoader.load();
        const formatHost = {
            getCanonicalFileName: (path) => path,
            getCurrentDirectory: tsBinary.sys.getCurrentDirectory,
            getNewLine: () => tsBinary.sys.newLine,
        };
        const { options, fileNames, projectReferences, } = this.tsConfigProvider.getByConfigFilename(configFilename);
        const createProgram = tsBinary.createIncrementalProgram || tsBinary.createProgram;
        const program = createProgram.call(ts, {
            rootNames: fileNames,
            projectReferences,
            options,
        });
        const pluginsConfig = get_value_or_default_1.getValueOrDefault(configuration, 'compilerOptions.plugins', appName);
        const plugins = this.pluginsLoader.load(pluginsConfig);
        const tsconfigPathsPlugin = tsconfig_paths_hook_1.tsconfigPathsBeforeHookFactory(options);
        const programRef = program.getProgram
            ? program.getProgram()
            : program;
        const before = plugins.beforeHooks.map((hook) => hook(programRef));
        const after = plugins.afterHooks.map((hook) => hook(programRef));
        // 根据配置 将src目录下的ts 生成js文件
        const emitResult = program.emit(undefined, undefined, undefined, undefined, {
            before: before.concat(tsconfigPathsPlugin),
            after,
            afterDeclarations: [],
        });
        const errorsCount = this.reportAfterCompilationDiagnostic(program, emitResult, tsBinary, formatHost);
        if (errorsCount) {
            process.exit(1);
        }
        else if (!errorsCount && onSuccess) {
            onSuccess();
        }
    }
```

>@nestjs/cli/actions/start.action.js

```javascript
    createOnSuccessHook(configuration, appName, debugFlag, outDirName, binaryToRun = 'node') {
        const sourceRoot = get_value_or_default_1.getValueOrDefault(configuration, 'sourceRoot', appName);
        const entryFile = get_value_or_default_1.getValueOrDefault(configuration, 'entryFile', appName);
        let childProcessRef;
        process.on('exit', () => childProcessRef && killProcess(childProcessRef.pid));
        return () => {
            if (childProcessRef) {
                childProcessRef.removeAllListeners('exit');
                childProcessRef.on('exit', () => {
                    childProcessRef = this.spawnChildProcess(entryFile, sourceRoot, debugFlag, outDirName, binaryToRun);
                    childProcessRef.on('exit', () => (childProcessRef = undefined));
                });
                childProcessRef.stdin && childProcessRef.stdin.pause();
                killProcess(childProcessRef.pid);
            }
            else {
                childProcessRef = this.spawnChildProcess(entryFile, sourceRoot, debugFlag, outDirName, binaryToRun);
                childProcessRef.on('exit', () => (childProcessRef = undefined));
            }
        };
    }
    spawnChildProcess(entryFile, sourceRoot, debug, outDirName, binaryToRun) {
        let outputFilePath = path_1.join(outDirName, sourceRoot, entryFile);
        if (!fs.existsSync(outputFilePath + '.js')) {
            outputFilePath = path_1.join(outDirName, entryFile);
        }
        let childProcessArgs = [];
        const argsStartIndex = process.argv.indexOf('--');
        if (argsStartIndex >= 0) {
            childProcessArgs = process.argv.slice(argsStartIndex + 1);
        }
        outputFilePath =
            outputFilePath.indexOf(' ') >= 0 ? `"${outputFilePath}"` : outputFilePath;
        const processArgs = [outputFilePath, ...childProcessArgs];
        if (debug) {
            const inspectFlag = typeof debug === 'string' ? `--inspect=${debug}` : '--inspect';
            processArgs.unshift(inspectFlag);
        }
        // 执行新生成的main.js入口文件
        return child_process_1.spawn(binaryToRun, processArgs, {
            stdio: 'inherit',
            shell: true,
        });
    }
```

> src/main.ts