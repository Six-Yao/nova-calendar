import { z } from "zod";

export const eventSchema = z
  .object({
    user: z.string(),
    title: z.string().min(1, "标题不能为空"),
    description: z.string().min(1, "描述不能为空"),
    startDate: z.date({ required_error: "开始时间不能为空" }),
    startTime: z.object({ hour: z.number(), minute: z.number() }, { required_error: "Start time不能为空" }),
    endDate: z.date({ required_error: "结束时间不能为空" }),
    endTime: z.object({ hour: z.number(), minute: z.number() }, { required_error: "End time不能为空" }),
    color: z.enum(["blue", "green", "red", "yellow", "purple", "orange", "gray"], { required_error: "Color不能为空" }),
  })
  .refine(
    data => {
      const startDateTime = new Date(data.startDate);
      startDateTime.setHours(data.startTime.hour, data.startTime.minute, 0, 0);

      const endDateTime = new Date(data.endDate);
      endDateTime.setHours(data.endTime.hour, data.endTime.minute, 0, 0);

      return startDateTime < endDateTime;
    },
    {
      message: "开始时间不能早于结束时间",
      path: ["startDate"],
    }
  );

export type TEventFormData = z.infer<typeof eventSchema>;
