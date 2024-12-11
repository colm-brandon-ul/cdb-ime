import { CustomActionHandler, LanguageFilesRegistry } from '@cinco-glsp/cinco-glsp-api';
import { Action, CustomAction } from '@cinco-glsp/cinco-glsp-common';

import * as path from 'path';

export interface Post { }
export interface Response { }
export enum HashValid {
    VALID,
    INVALID
}


interface UtdSibFilesRequest {
    file_ids: string[];
}

interface UtdSibFilesResponse {
    files: { [key: string]: string };
}

interface CheckSibFilesHashesRequest {
    fileHashes: { [key: string]: string };
}

interface CheckSibFilesHashesResponse {
    hashesValid: { [key: string]: HashValid };
}



export class SyncSibLibraryWithBackEnd extends CustomActionHandler {
    override CHANNEL_NAME: string | undefined = 'SyncSib [' + this.modelState.root.id + ']';
    private TO_EXCLUDE = {
        "files.exclude": {
            "**/.git": true,
            "**/.svn": true,
            "**/.hg": true,
            "**/.DS_Store": true,
            "**/.vscode": true,
            "**/.idea": true,
            "**/.settings": true,
            "**/node_modules": true,
            "**/.theia": true,
            "**/.siblib": true
        }
    }

    private DIRECTORY_NAME: string = ".siblib/";
    private FILE_EXTENSION: string = ".sibs"
    private THEIA_FOLDER: string = ".theia"
    private REMOTE_HOST: string = 'https://cdb-demo.colmb.me'
    private CHECK_SIB_FILES_ENDPOINT: string = 'check-sib-files-hashes'
    private GET_INSTALLED_LIBRARIES_ENDPOINT: string = 'get-missing-sib-files'
    private GET_SIB_FILES_BY_IDS: string = 'get-utd-sib-files'

    override async execute(action: CustomAction, ...args: any): Promise<Action[]> {

        // // hide sibs folder
        this.hideFolderInWorkspace("**/" + this.DIRECTORY_NAME.slice(0, -1))

        this.log(JSON.stringify(this.REMOTE_HOST))

         // create .siblib directory if it doesn't exist
         if (!this.existsDirectory(this.DIRECTORY_NAME)) {
            this.createDirectory(this.DIRECTORY_NAME)
        }

        // get all local sib file names
        const allLocalSibLibFiles: string[] = this.readDirectory(this.DIRECTORY_NAME)
        this.log(JSON.stringify(allLocalSibLibFiles))

        const req1: UtdSibFilesRequest = {
            file_ids: allLocalSibLibFiles
        }

        const missingRemoteFiles: UtdSibFilesResponse = await this.getAllInstalledSibLibs(req1)
        
        // const req2:
        const hashResults = await this.validateSibLibrary(
            allLocalSibLibFiles.filter(f => !Object.keys(missingRemoteFiles.files).includes(f))
        )

        this.updateLocalSibLibs(
            Object.keys(hashResults).filter((a)=>hashResults[a] != HashValid.VALID),
            missingRemoteFiles.files
        )


        return []
    }

    override canExecute(action: CustomAction, ...args: unknown[]): boolean | Promise<boolean> {
        return true;
    }

    async updateLocalSibLibs(siblibss2Update: string[], missingRemoteFiles: { [key: string]: string }): Promise<void> {

        const req: UtdSibFilesRequest = {
            file_ids: siblibss2Update
        }

        const reslocal: UtdSibFilesResponse = await this.makePostRequest(
            `${this.REMOTE_HOST}/sib-manager/ext/${this.GET_SIB_FILES_BY_IDS}`, 
            req)
        

        // // could parallelise this
        siblibss2Update.forEach((siblib, index) => {
            if (this.exists(this.DIRECTORY_NAME + siblib + this.FILE_EXTENSION)) {
                this.deleteFile(this.DIRECTORY_NAME + siblib + this.FILE_EXTENSION);
            }
            
            if (siblib in reslocal.files){
                this.createFile(this.DIRECTORY_NAME + siblib + this.FILE_EXTENSION, reslocal.files[siblib]!);
            }
        })
        // create files that are on remote, but not local

        Object.keys(missingRemoteFiles).map((file_key)=>{
            this.createFile(this.DIRECTORY_NAME + file_key + this.FILE_EXTENSION, missingRemoteFiles[file_key]!);
        })


    }

    hideFolderInWorkspace(folderToHide: string, workspacePath: string = "/"): void {
        const settingsPath = path.join(workspacePath, '.theia');
        const settingsFilePath = path.join(settingsPath, 'settings.json')


        // create .theia dir in workspace
        if (!this.existsDirectory(settingsPath)) {
            this.createDirectory(settingsPath)
        }

        // create the settings.json if it doesn't exist
        if (!this.exists(settingsFilePath)) {
            this.createFile(settingsFilePath, JSON.stringify(this.TO_EXCLUDE))
        }
        else {
            var settings = JSON.parse(this.readFile(settingsFilePath.slice(1))!)

            if (!settings.hasOwnProperty("files.exclude")) {
                settings["files.exclude"] = {
                    folderToHide: true
                }
                this.createFile(settingsFilePath, JSON.stringify(settings), true)
            }
            else {
                if (!settings["files.exclude"].hasOwnProperty(folderToHide)) {
                    settings["files.exclude"][folderToHide] = true
                    this.createFile(settingsFilePath, JSON.stringify(settings), true)
                }
            }

        }
    }

    async getAllInstalledSibLibs(req: UtdSibFilesRequest): Promise<UtdSibFilesResponse> {
        this.log(JSON.stringify(req))

        const res: UtdSibFilesResponse = await this.makePostRequest(
            `${this.REMOTE_HOST}/sib-manager/ext/${this.GET_INSTALLED_LIBRARIES_ENDPOINT}`,
            req
        )
        return res
    }

    async makePostRequest(url: string, data: Post): Promise<any> {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                this.error(`${response.status}`)
                this.error(`${response.text}`)
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            this.error('There was a problem with the fetch operation:' + error);
            throw error;
        }
    }

    async makeGetRequest(
        url: string,
        options: {
            params?: Record<string, string>;
            headers?: Record<string, string>;
        } = {}
    ): Promise<any> {
        try {
            const fetchOptions: RequestInit = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };

            // Add query parameters to the URL if provided
            if (options.params) {
                const queryParams = new URLSearchParams(options.params);
                url += `?${queryParams.toString()}`;
            }

            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                this.error(`HTTP error! status: ${response.status}`);
                this.error(`Response text: ${await response.text()}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            this.error('There was a problem with the fetch operation:' + error);
            throw error;
        }
    }

    async validateSibLibrary(allSibFiles: string[]): Promise<{ [key: string]: HashValid } > {
        // read all model files

        const allHashes: { [key: string]: string } = {};

        allSibFiles.forEach(sf => {
            allHashes[sf] = SHA256.hash(this.readFile(this.DIRECTORY_NAME + sf)!);
        });


        const req: CheckSibFilesHashesRequest = {
            fileHashes: allHashes
        }

        // submit to server to ensure all valid

        const res: CheckSibFilesHashesResponse = await this.makePostRequest(`${this.REMOTE_HOST}/sib-manager/ext/${this.CHECK_SIB_FILES_ENDPOINT}`, req)


        // return the list of sibfiles which are invalid
        return res.hashesValid
    }
}



// TS implementation of SHA256 for validating files..
class SHA256 {
    private static readonly K: number[] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    private static readonly H: number[] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    private static rightRotate(value: number, amount: number): number {
        return (value >>> amount) | (value << (32 - amount));
    }

    private static ch(x: number, y: number, z: number): number {
        return (x & y) ^ (~x & z);
    }

    private static maj(x: number, y: number, z: number): number {
        return (x & y) ^ (x & z) ^ (y & z);
    }

    private static sigma0(x: number): number {
        return SHA256.rightRotate(x, 2) ^ SHA256.rightRotate(x, 13) ^ SHA256.rightRotate(x, 22);
    }

    private static sigma1(x: number): number {
        return SHA256.rightRotate(x, 6) ^ SHA256.rightRotate(x, 11) ^ SHA256.rightRotate(x, 25);
    }

    private static gamma0(x: number): number {
        return SHA256.rightRotate(x, 7) ^ SHA256.rightRotate(x, 18) ^ (x >>> 3);
    }

    private static gamma1(x: number): number {
        return SHA256.rightRotate(x, 17) ^ SHA256.rightRotate(x, 19) ^ (x >>> 10);
    }

    public static hash(message: string): string {
        const utf8 = new TextEncoder().encode(message);
        const bitLength = utf8.length * 8;
        const bytes = new Uint8Array(utf8.length + 8 + 1 + 64 - ((utf8.length + 8 + 1) % 64));
        bytes.set(utf8);
        bytes[utf8.length] = 0x80;
        new DataView(bytes.buffer).setBigUint64(bytes.length - 8, BigInt(bitLength), false);

        const words = new Uint32Array(64);
        const state = new Uint32Array(SHA256.H);

        for (let i = 0; i < bytes.length; i += 64) {
            for (let j = 0; j < 16; j++) {
                words[j] = new DataView(bytes.buffer).getUint32(i + j * 4, false);
            }

            for (let j = 16; j < 64; j++) {
                const s0 = SHA256.gamma0(words[j - 15]);
                const s1 = SHA256.gamma1(words[j - 2]);
                words[j] = words[j - 16] + s0 + words[j - 7] + s1;
            }

            let [a, b, c, d, e, f, g, h] = state;

            for (let j = 0; j < 64; j++) {
                const S1 = SHA256.sigma1(e);
                const ch = SHA256.ch(e, f, g);
                const temp1 = h + S1 + ch + SHA256.K[j] + words[j];
                const S0 = SHA256.sigma0(a);
                const maj = SHA256.maj(a, b, c);
                const temp2 = S0 + maj;

                h = g;
                g = f;
                f = e;
                e = (d + temp1) >>> 0;
                d = c;
                c = b;
                b = a;
                a = (temp1 + temp2) >>> 0;
            }

            state[0] += a;
            state[1] += b;
            state[2] += c;
            state[3] += d;
            state[4] += e;
            state[5] += f;
            state[6] += g;
            state[7] += h;
        }

        return state.reduce((hash, val) => hash + val.toString(16).padStart(8, '0'), '');
    }
}

LanguageFilesRegistry.register(SyncSibLibraryWithBackEnd)