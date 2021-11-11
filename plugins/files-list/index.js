const PathUtils = require('path')
const fs = require('fs/promises')

const RelativeRootPath = '../../'
const RootPath = PathUtils.resolve(__dirname, RelativeRootPath)

const ArgTable = {
    '-d': 'The dir that will be disposed.',
    '-o': 'The dir where output to.',
    '-e': 'The extension of target files.'
}
const argsStr = process.argv.slice(2)
const args = {}

for (let i = 0; i < argsStr.length; i+=2) {
    if (argsStr[i] === '-h') {
        console.log(ArgTable)
        process.exit(0)
    }
    if (argsStr[i] in ArgTable) {
        args[argsStr[i]] = argsStr[i + 1]
    } else {
        exitWithError(`Invalid argument ${argsStr[i]}, use -h to get help.`)
    }
}

if (!args['-d']) {
    exitWithError('Invalid dir path. Use -d to indicate.')
}
if (!args['-o']) {
    args['-o'] = RootPath + '/data/files-list.output'
}
if (!args['-e']) {
    args['-e'] = '*'
}

main()

async function main () {
    const files = await readDirRecursively(args['-d'])
    const res = []
    for (const path of files) {
        const relativePath = path.slice(RootPath.length + 1)
        res.push(PathUtils.parse(relativePath))
    }
    const output = res.filter(e => args['-e'] === '*' ? true : args['-e'] === e.ext)
    await writeFile(args['-o'], JSON.stringify(output))
}

async function writeFile (mypath, str) {
    const dir = PathUtils.parse(mypath).dir
    try {
        await fs.access(dir)
    } catch (_) {
        fs.mkdir(dir)
    }
    await fs.writeFile(mypath, str)
}
async function readDirRecursively (mypath) {
    const res = []
    const files = await fs.readdir(mypath, {
        withFileTypes: true
    }).catch(err => {
        exitWithError(err.message)
    })
    for await (const file of files) {
        const fullPath = PathUtils.resolve(mypath, file.name)
        if (file.isDirectory()) {
            res.push.apply(res, await readDirRecursively(fullPath))
        } else {
            res.push(fullPath)
        }
    }
    return res
}

function exitWithError (message) {
    console.error(message)
    process.exit(0)
}
