import { readFile } from 'fs/promises';
import { join } from 'path';
import {Inject, Injectable, Logger, NotFoundException} from "@nestjs/common";
import { exit } from 'process';

@Injectable()
export class MailerService {

    public constructor(@Inject('MAILER_TRANSPORTER') private readonly transporter) {}

    private async getPasswordResetEmailTemplate(resetUrl: string): Promise<string> {
        try {
            const templatePath = join(__dirname, '..', 'templates', 'reset-password.template.html');            
            const template = await readFile(templatePath, 'utf8');
            let htmlContent = template.replace('{{resetUrl}}', resetUrl);

            return htmlContent;
          } catch (error) {
            throw new Error(`Failed to read or process template: ${error.message}`);
          }
    }

    public async sendPasswordResetEmail(email: string, resetToken: string) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const htmlContent = await this.getPasswordResetEmailTemplate(resetUrl);

        let from = 'Accountable Notification <${process.env.SMTP_FROM}>';

        const mailOptions = {
            from: from,
            to: email,
            subject: '[Accountable] Reset Password',
            html: htmlContent,
            text: `Click the link below to reset your password: ${resetUrl}`
        };

        await this.transporter.sendMail(mailOptions);
    }
}
