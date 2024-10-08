import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { AuthService } from "../auth/auth.service";
import { EmailService } from "../email/email.service";
import { UserService } from "../user/user.service";
import { USER_ROLE } from "src/auth/enums/user-role.enum";
import { ConfigVariables } from "src/service-config";
import { ConfigService } from "@nestjs/config";


@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);
    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly emailService: EmailService,
        private readonly configService: ConfigService<ConfigVariables>,
        /* eslint-disable */
        // @ts-ignore //
        @InjectConnection() private readonly mongoose: Connection,
    ) { }

    async getBlockedUsers() {
        return this.userService.findAllBlockedUsers();
    }

    async blockUserById(userId: string) {
        this.logger.debug(`Blocking user ${userId}`);
        this.userService.blockUserById(userId);
        return { status: 'block' };
    }
    async unblockUserById(userId: string) {
        this.logger.debug(`Unblocking user ${userId}`);
        this.userService.unblockUserById(userId);
        return { status: 'unblock' };
    }

    async permanentDeleteUserById(userId: string) {
        this.logger.debug(`Deleting user ${userId}`);
        const session = await this.mongoose.startSession();
        session.startTransaction();

        try {
            const user = await this.userService.findUserById(userId);
            if (!user) {
                throw new NotFoundException();
            }
            await this.userService.deleteByUserId(userId, session);
            await this.authService.deleteByUserId(userId, session);
            await this.emailService.sendEmail('Account deleted', 'Your account has been deleted', user.email);
            await session.commitTransaction();
        } catch (error) {
            this.logger.debug(error);
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

        return { status: 'deleted' };
    }

    async upgradeUserRole(userId: string, role: USER_ROLE) {
        this.logger.debug(`Upgrading user ${userId} to ${role}`);
        const session = await this.mongoose.startSession();
        session.startTransaction();
        try {
            const user = await this.userService.findUserById(userId);
            if (!user) {
                throw new NotFoundException();
            }
            await this.userService.updateByEmail(user.email, role, user.name, session);
            await session.commitTransaction();
        } catch (error) {
            this.logger.debug(error);
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

        return { status: 'upgraded' };
    }

}