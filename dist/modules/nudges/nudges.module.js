"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NudgesModule = void 0;
const common_1 = require("@nestjs/common");
const nudges_controller_1 = require("./nudges.controller");
const nudges_service_1 = require("./nudges.service");
const voice_module_1 = require("../voice/voice.module");
let NudgesModule = class NudgesModule {
};
exports.NudgesModule = NudgesModule;
exports.NudgesModule = NudgesModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => voice_module_1.VoiceModule)],
        controllers: [nudges_controller_1.NudgesController],
        providers: [nudges_service_1.NudgesService],
        exports: [nudges_service_1.NudgesService],
    })
], NudgesModule);
//# sourceMappingURL=nudges.module.js.map