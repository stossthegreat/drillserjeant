"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreaksModule = void 0;
const common_1 = require("@nestjs/common");
const streaks_controller_1 = require("./streaks.controller");
const streaks_service_1 = require("./streaks.service");
let StreaksModule = class StreaksModule {
};
exports.StreaksModule = StreaksModule;
exports.StreaksModule = StreaksModule = __decorate([
    (0, common_1.Module)({
        controllers: [streaks_controller_1.StreaksController],
        providers: [streaks_service_1.StreaksService],
        exports: [streaks_service_1.StreaksService],
    })
], StreaksModule);
//# sourceMappingURL=streaks.module.js.map