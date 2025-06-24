"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioService = void 0;
const envs_1 = require("../../config/envs");
const twilio_1 = __importDefault(require("twilio"));
const promises_1 = require("node:stream/promises"); // solo pipeline / finished
const node_stream_1 = require("node:stream"); // aquí está fromWeb()
const PUBLIC_DIR = './public/quotes';
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const node_buffer_1 = require("node:buffer");
class TwilioService {
    constructor() {
        this.client = (0, twilio_1.default)(envs_1.envs.TWILIO_ACCOUNT_SID, envs_1.envs.TWILIO_AUTH_TOKEN);
    }
    deleteFileFromApi(mediaItem) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.api.accounts(envs_1.envs.TWILIO_ACCOUNT_SID).messages(mediaItem.MessageSid)
                .media(mediaItem.mediaSid).remove();
        });
    }
    getFileFromUrl(mediaUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = node_buffer_1.Buffer
                .from(`${envs_1.envs.TWILIO_ACCOUNT_SID}:${envs_1.envs.TWILIO_AUTH_TOKEN}`)
                .toString('base64');
            const res = yield fetch(mediaUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return res.body;
        });
    }
    saveFiles(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { filename, mediaUrl } = options;
            if (!(0, fs_1.existsSync)(PUBLIC_DIR)) {
                (0, fs_1.mkdirSync)(PUBLIC_DIR, { recursive: true });
            }
            const fullPath = path_1.default.join(PUBLIC_DIR, filename);
            if ((0, fs_1.existsSync)(fullPath))
                return;
            const token = node_buffer_1.Buffer.from(`${envs_1.envs.TWILIO_ACCOUNT_SID}:${envs_1.envs.TWILIO_AUTH_TOKEN}`).toString('base64');
            const res = yield fetch(mediaUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            // Convierte ReadableStream web → Node Readable y haz pipe con pipeline
            const nodeStream = node_stream_1.Readable.fromWeb(res.body);
            const fileStream = (0, fs_1.createWriteStream)(fullPath);
            yield (0, promises_1.pipeline)(nodeStream, fileStream);
            this.deleteFileFromApi(options);
        });
    }
    createWhatsAppMessage(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { body, to } = options;
            const message = yield this.client.messages.create({
                body: body.toString(),
                to: `whatsapp:+${to}`, // Text your number
                from: 'whatsapp:+5215596603295', // From a valid Twilio number
            });
        });
    }
}
exports.TwilioService = TwilioService;
