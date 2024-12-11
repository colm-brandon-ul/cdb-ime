import { Container, GeneratorHandler, GraphModel, LanguageFilesRegistry, ModelElement, Node } from '@cinco-glsp/cinco-glsp-api';
import { GeneratorAction, deletableValue} from '@cinco-glsp/cinco-glsp-common';


// Need to define the correct interface for post request...

export interface Post {}
export interface Response {}


export interface WorkFlowModelPost extends Post {
    model: string;
}

interface CheckSibFilesHashesRequest {
    fileHashes: { [key: string]: string };
}

interface CheckSibFilesHashesResponse {
    hashesValid: { [key: string]: HashValid };
}

export enum HashValid {
    VALID,
    INVALID
}

export interface WorkflowExecutionUrlResponse extends Response {
    url: string
}


export class CincoDeBioGenerator extends GeneratorHandler {
    override CHANNEL_NAME: string | undefined = 'CincoDeBio Workflow [' + this.modelState.root.id + ']';
    private CHECK_SIB_FILES_ENDPOINT: string = 'check-sib-files-hashes'
    private SIB_DIRECTORY_NAME: string = ".siblib/";
    private SIB_FILE_EXTENSION: string = ".sibs"
    private INTERNAL_URL: string = ""
    private REMOTE_URL: string = 'https://cdb-demo.colmb.me'
    private MODEL_SUBMISSION_ENDPOINT: string = 'execution-api/ext/model/submit'




    override async execute(action: GeneratorAction, ...args: unknown[]) {

        if (!await this.validateSibLibrary()){
            this.notify("The SIB Library is not up to date, please refresh it","ERROR" )
        }
        else{
            this.notify('All local sibs are correct.')
        }
        

        // Send the Workflow model to the execution backend!
        
        // parse action
        const model = this.getElement(action.modelElementId) as GraphModel;
        // this.warn("Generating Workflow Execution Program")

        if (await model.valid){
            this.generate(model)
        }
        else{
            this.notify('Generation failed! Model Invalid. See: Cinco Cloud Model Validation.', 'OK');
        }

        
        return [];
    }

    override canExecute(action: GeneratorAction, ...args: unknown[]): Promise<boolean> | boolean {
        const element = this.getElement(action.modelElementId);
        return element !== undefined;
    }

    /**
     * generate files
     */
     async generate (model: GraphModel): Promise<void> {
        this.info("Finished Generation")
        // clone the model,
        // filter out irrelevant keys
        const cleanedModel = cleanModel(model)

        const urlres: WorkflowExecutionUrlResponse = await this.remoteSubmitModel(
            cleanedModel
        )

        this.notify(`${urlres.url}`)
        this.log(`${urlres.url}`)

        // if (false){
            // const res: WorkflowExecutionUrlResponse = await makePostRequest(this.MODEL_SUBMISSION_ENDPOINT,m)
            // this.log(JSON.stringify(res))
            // Launch workflow front-end in new tab? How to do this?
        // }

        // need to update the UI with URL
        
        this.notify('Generation successfull!', 'OK');


    }

    async remoteSubmitModel(modelJson: object, isV2: boolean = true): Promise<WorkflowExecutionUrlResponse> {
        const formData = new FormData();
        const jsonBlob = new Blob([JSON.stringify(modelJson)], { type: 'application/json' });
        formData.append('model', jsonBlob, 'model.json');

        const url = new URL(`${this.REMOTE_URL}/${this.MODEL_SUBMISSION_ENDPOINT}`);
        url.searchParams.append('v2', isV2.toString());

        try {
          const response = await fetch(url, {
            method: 'POST',
            body: formData,
          });
      
          if (!response.ok) {
            this.log(`${response.status}`)
            this.log(`${response.text}`)
            throw new Error(`HTTP error! status: ${response.status}`);
          }
      
          const result = await response.json();
          return result;
        } catch (error) {
          this.error('Error submitting model:' + error);
          throw error;
        }
      }

    async validateSibLibrary(): Promise<boolean> { 
        // read all model files
        var allSibFiles: string[] = this.readDirectory(this.SIB_DIRECTORY_NAME)

        const allHashes: { [key: string]: string } = {};

        allSibFiles.forEach(sf => {
            allHashes[sf] = SHA256.hash(this.readFile(this.SIB_DIRECTORY_NAME + sf)!);
        });


        const req: CheckSibFilesHashesRequest = {
            fileHashes: allHashes
        }

        // submit to server to ensure all valid

        const res: CheckSibFilesHashesResponse = await makePostRequest(`${this.REMOTE_URL}/sib-manager/ext/${this.CHECK_SIB_FILES_ENDPOINT}`, req)
        

        
        // check if any are invalid
        return !Object.values(res.hashesValid).some(value => value === HashValid.INVALID);
    }

    

}

export function cleanModel(model: any): any{
        // remove any keys which are irrelevant from the code gen POV, eg documentation etc..

        return model
}




export async function makeGetRequest(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
      throw error;
    }
}
  
export async function makePostRequest(url: string, data: Post): Promise<any> {
    try {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
    } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    throw error;
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


export function openNewTab(url: string): void {
    window.open(url, '_blank')?.focus();
}
  

// register into app
LanguageFilesRegistry.register(CincoDeBioGenerator);
