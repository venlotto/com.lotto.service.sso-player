import { registerAs } from '@nestjs/config';

export default registerAs(
    'doc',
    (): Record<string, any> => ({
        name: `${process.env.APP_MODULE} APIs Specification`,
        description: "This is the Bills to Pay of a company where has the following functionality <br><br> GET, ADD, UPDATE, REMOVE purchases orders",
        version: '1.0',
        prefix: '/docs',
    }),
);
