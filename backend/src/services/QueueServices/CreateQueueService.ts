// import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";

interface Request {
  queue: string;
  isActive: boolean;
  from_ia: boolean;
  userId: number;
  tenantId: number | string;
}

const CreateQueueService = async ({
  queue,
  isActive,
  userId,
  from_ia,
  tenantId
}: Request): Promise<Queue> => {
  const queueData = await Queue.create({
    queue,
    isActive,
    userId,
    from_ia,
    tenantId
  });

  return queueData;
};

export default CreateQueueService;
