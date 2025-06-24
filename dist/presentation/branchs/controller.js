"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchController = void 0;
const create_branch_dto_1 = require("../../domain/dtos/branch/create-branch.dto");
const create_branch_use_case_1 = require("../../application/use-cases/branch/create-branch.use-case");
const get_branch_use_case_1 = require("../../application/use-cases/branch/get-branch.use-case");
const get_branchs_use_case_1 = require("../../application/use-cases/branch/get-branchs.use-case");
class BranchController {
    constructor(branchRepository) {
        this.branchRepository = branchRepository;
        this.createBranch = (req, res, next) => {
            const body = req.body;
            const [error, createBranchDto] = create_branch_dto_1.CreateBranchDto.execute(body);
            if (error) {
                res.status(400).json({ error });
                return;
            }
            new create_branch_use_case_1.CreateBranchUseCase(this.branchRepository)
                .execute(createBranchDto)
                .then(data => {
                res.json(Object.assign({}, data));
            })
                .catch((error) => {
                res.status(500).json(error);
            });
        };
        this.getBranch = (req, res) => {
            const id = req.params.id;
            new get_branch_use_case_1.GetBranchUseCase(this.branchRepository)
                .execute(id)
                .then((branch) => {
                res.json(branch);
            })
                .catch((error) => {
                res.status(500).json(error);
            });
        };
        this.getBranchs = (req, res) => {
            new get_branchs_use_case_1.GetBranchsUseCase(this.branchRepository)
                .execute()
                .then((branchs) => {
                res.json(branchs);
            })
                .catch((error) => {
                res.status(500).json(error);
            });
        };
    }
}
exports.BranchController = BranchController;
