import Tenant from "../../models/Tenant";

interface Request {
    id: number | string;
    name: string;
    cnpj: string;
}

const AdminUpdateTenantService = async ({
    id,
    name,
    cnpj
}: Request): Promise<any> => {

    const tenant = await Tenant.findByPk(id);

    await tenant!.update({
        name,
        cnpj
    });

    const serialized = {
        id: tenant!.id,
        name: tenant!.name,
        cnpj: tenant!.cnpj,
        status: tenant!.status,
        ownerId: tenant!.ownerId
    };

    return serialized;
};

export default AdminUpdateTenantService;
