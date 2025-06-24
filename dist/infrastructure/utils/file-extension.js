"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileExtension = void 0;
const path_1 = __importDefault(require("path"));
const getFileExtension = (file) => {
    return path_1.default.extname(file).slice(1);
};
exports.getFileExtension = getFileExtension;
