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
exports.WhatsAppController = void 0;
const user_question_use_case_1 = require("../../application/use-cases/whatsApp/user-question.use-case");
const ext_name_1 = __importDefault(require("ext-name"));
const path_1 = __importDefault(require("path"));
const url_1 = __importDefault(require("url"));
const save_media_file_use_case_1 = require("../../application/use-cases/file-storage/save-media-file.use-case");
var Message;
(function (Message) {
    Message[Message["document"] = 0] = "document";
    Message[Message["text"] = 1] = "text";
})(Message || (Message = {}));
const ACCEPTED_FORMATS = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/pdf'];
class WhatsAppController {
    constructor(openAIService, emailService, chatThreadRepository, quoteRepository, customerRepository, messageService, fileStorageService) {
        this.openAIService = openAIService;
        this.emailService = emailService;
        this.chatThreadRepository = chatThreadRepository;
        this.quoteRepository = quoteRepository;
        this.customerRepository = customerRepository;
        this.messageService = messageService;
        this.fileStorageService = fileStorageService;
    }
    webhookIncomingMessages(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = req.body;
            const { MediaContentType0, SmsMessageSid, NumMedia, ProfileName, MessageType, SmsSid, WaId, SmsStatus, Body, To, NumSegments, ReferralNumMedia, MessageSid, AccountSid, From, MediaUrl0, ApiVersion, } = payload;
            console.log(payload);
            try {
                if (MessageType === 'text') {
                    const userQuestion = yield new user_question_use_case_1.UserCuestionUseCase(this.openAIService, this.chatThreadRepository, this.quoteRepository, this.customerRepository, this.emailService, this.fileStorageService).execute({ phone: WaId, question: Body });
                    const asistantResponse = userQuestion.filter(q => q.role === 'assistant')[0];
                    yield this.messageService.createWhatsAppMessage({
                        body: asistantResponse.content,
                        to: WaId
                    });
                    return res.status(202).send('Accepted');
                }
                if (MessageType === 'document') {
                    if (!ACCEPTED_FORMATS.includes(MediaContentType0)) {
                        yield this.messageService.createWhatsAppMessage({
                            body: ['Por seguridad no puedo aceptar ese tipo de archivo, solo archivos con extension pdf o excel'],
                            to: WaId
                        });
                        return res.status(415).send('Unsupported Media Type');
                    }
                    const mediaUrl = MediaUrl0;
                    const contentType = MediaContentType0;
                    const extension = ext_name_1.default.mime(contentType)[0].ext;
                    const mediaSid = path_1.default.basename(url_1.default.parse(mediaUrl).pathname);
                    const filename = `${mediaSid}.${extension}`;
                    // await this.messageService.saveFiles({
                    //   mediaUrl,
                    //   MessageSid,
                    //   mediaSid,
                    //   filename,
                    // })
                    const file = yield this.messageService.getFileFromUrl(mediaUrl);
                    yield this.messageService.deleteFileFromApi({ MessageSid, mediaSid });
                    const fileUrl = yield new save_media_file_use_case_1.SaveMediaFileUseCase(this.fileStorageService)
                        .execute(file, filename);
                    const fileStream = yield this.fileStorageService.getFileStream(filename);
                    console.log({ fileStream });
                    const messaggeUploadFile = `archivo_adjuntado\nfile_key:${filename})`;
                    const userQuestion = yield new user_question_use_case_1.UserCuestionUseCase(this.openAIService, this.chatThreadRepository, this.quoteRepository, this.customerRepository, this.emailService, this.fileStorageService).execute({ phone: WaId, question: messaggeUploadFile });
                    const asistantResponse = userQuestion.filter(q => q.role === 'assistant')[0];
                    yield this.messageService.createWhatsAppMessage({
                        body: asistantResponse.content,
                        to: WaId
                    });
                    return res.status(202).send('Accepted');
                }
                yield this.messageService.createWhatsAppMessage({
                    body: ['Por seguridad no puedo aceptar ese tipo de archivo, solo puedo aceptar pdf o excel'],
                    to: WaId
                });
                res.status(202).send('Accepted');
            }
            catch (error) {
                console.log(error);
                res
                    .status(500)
                    .json({
                    error: 'Ocurrio un error'
                });
            }
        });
    }
    sendEmail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.emailService.sendEmail({
                    to: ['eeramirez@tuvansa.com.mx'],
                    subject: "test",
                    htmlBody: "mensaje de prueba"
                });
                res.json({
                    ok: true,
                    msg: 'Enviado correctamente'
                });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Hubo un error' });
            }
        });
    }
}
exports.WhatsAppController = WhatsAppController;
