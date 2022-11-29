import 'exit-on-epipe';
import fs from 'fs';
import {program} from 'commander';
import readline from 'readline';
import path from 'path';

const UTILS_NAME = 'belousov-utils';

export default function run() {
    program
        .requiredOption('-f, --file <file>', 'Путь до файла')
        .requiredOption('-o, --output <path>', 'Папка, куда складывать файлы')
        .option('-h, --header <count-rows>', 'Количество строк в хедере. Default 1')
        .option('-c, --colname <num-column>', 'Из какой колонки брать имя. Default 1')
        .option('-e, --encoding <str>', 'Кодировка. Default utf-8')
        .option('-s, --separator <str>', 'Разделитель в csv. Default ;');

    program.parse(process.argv);
    const options = program.opts();

    const separator = options.separator || ';';
    const file = options.file;
    const encoding = options.encoding || 'utf-8';
    const headerRows = options.header || 1;
    const colname = options.colname || 1;
    const output = options.output;

    if (!fs.existsSync(file)) {
        program.error(UTILS_NAME + ': ' + file + ': No such file', {exitCode: 2});
    }

    if (!fs.existsSync(output)) {
        program.error(UTILS_NAME + ': ' + output + ': No such directory', {exitCode: 2});
    }

    const readStream = fs.createReadStream(file, encoding);
    const rl = readline.createInterface({input: readStream});

    const header: string[] = [];

    rl.on('line', (line) => {
        if (header.length < headerRows) {
            header.push(line);
        } else {
            const columns = line.split(separator);
            if (columns.some(Boolean)) {
                const filename = columns[colname - 1] || `rand_${Math.random()}`;
                const data = header.join('\r\n') + '\r\n' + line + '\r\n';
                fs.appendFileSync(path.join(output, filename + '.csv'), data, {
                    encoding,
                    flag: 'w',
                });
            }
        }
    });
    rl.on('error', (error) => program.error(error.message));
    rl.on('close', () => {
        console.log('FINISH');
    });
}
