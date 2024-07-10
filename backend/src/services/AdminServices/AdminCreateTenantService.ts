import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Tenant from "../../models/Tenant";

interface Request {
    name: string;
    status: string;
    cnpj: string;
    tenantId: number | string;
}

interface RequestUser {
    name: string;
    status: string;
    cnpj: string;
}

interface Response {
    name: string;
    id: number;
    status: string;
    cnpj: string;
}

export const CreateTenantService = async ({
    name,
    status,
    cnpj,
    tenantId
}: Request): Promise<Response> => {
    const tenant = await Tenant.create({
        name,
        status,
        cnpj,
        ownerId: tenantId
    });

    const serializeTenant = {
        id: tenant.id,
        name: tenant.name,
        status: tenant.status,
        cnpj: tenant.cnpj,
        ownerId: tenant.ownerId
    };

    return serializeTenant;
};


export const CreateTenantUserService = async ({
    name,
    cnpj,

}: RequestUser): Promise<Response> => {
    const schema = Yup.object().shape({
        name: Yup.string().required().min(2),
    });

    try {
        await schema.validate({ name, });
    } catch (err) {
        throw new AppError(err.message);
    }

    const tenant = await Tenant.create({
        name,
        status,
        cnpj
    });

    const serializeTenant = {
        id: tenant.id,
        name: tenant.name,
        status: tenant.status,
        cnpj: tenant.cnpj,
    };

    return serializeTenant;
};