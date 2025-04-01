"use client";

import { quizCreationSchema } from "@/schemas/form/quiz";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { BookOpen, CopyCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import {  z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import {  useMutation } from "@tanstack/react-query";
import LoadingRadar from "./LoadingRadar";
import { toast } from "react-toastify";
import { tech } from "@/data/tech";

type Props = {
  topic: string;
};

type Input = z.infer<typeof quizCreationSchema>;

const QuizCreation = ({ topic: topicParam }: Props) => {
  const router = useRouter();
  const [showLoader, setShowLoader] = React.useState(false);
  const [finishedLoading, setFinishedLoading] = React.useState(false);
  const { mutateAsync: getQuestions, isLoading } = useMutation({
    mutationFn: async ({ amount, topic, type }: Input) => {
      const response = await axios.post("/api/game", { amount, topic, type });
      return response.data;
    },
  });

  const validateTopic = (tpc: string) => {
    return true;
  };

  const form = useForm<Input>({
    resolver: zodResolver(quizCreationSchema),
    defaultValues: {
      topic: topicParam,
      type: "mcq",
      amount: 3,
    },
  });

  const isTopicInvalid = (topic: string) => {
    if (topic.length >= 4) {
      return !validateTopic(topic);
    }
    return true;
  };

  const onSubmit = async (input: Input) => {
    setShowLoader(true);
    getQuestions(
      {
        amount: input.amount,
        topic: input.topic,
        type: input.type,
      },
      {
        onSuccess: ({ gameId }: { gameId: string }) => {
          setFinishedLoading(true);
          const timeOut = setTimeout(() => {
            if (form.getValues("type") === "open_ended") {
              router.push(`/play/open-ended/${gameId}`);
            } else if (form.getValues("type") === "mcq") {
              router.push(`/play/mcq/${gameId}`);
            }
          }, 2000);
          return () => clearTimeout(timeOut);
        },
        onError: (error) => {
          setShowLoader(false);
          if (error instanceof AxiosError) {
            if (error.response?.status === 500) {
              toast("Something went wrong", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
              });
            }
          }
        },
      }
    );
  };

  form.watch();


  if (showLoader) {
    return <LoadingRadar finished={finishedLoading} />;
  }

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-16rem)]">
      <Card>
        <CardHeader className="flex items-center flex-col">
          <h2 className="text-2xl font-bold">Quiz Creation</h2>
          <CardBody>Choose a Topic</CardBody>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="flex flex-col gap-2 items-center justify-center overflow-auto">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex flex-col mt-4 w-full max-w-xs gap-4">
                <Controller
                  name="topic"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                    {...field}
                      isRequired 
                      name="topic"
                      variant="underlined"
                      className="max-w-xs"
                      label="Enter a topic"
                      placeholder="Programming Language or Framework "
                    >
                      {tech.map((tech) => (
                        <SelectItem key={tech.key}>{tech.label}</SelectItem>
                      ))}
                      
                    </Select>
                  )}
                />

                <Input
                  {...form.control}
                  name="amount"
                  placeholder="How many questions?"
                  type="number"
                  {...form}
                  onChange={(e) => {
                    form.setValue("amount", parseInt(e.target.value));
                  }}
                  defaultValue="3"
                  min="1"
                  max="10"
                />
              </div>
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <div className="flex justify-between">
                    <Button
                      color={
                        form.getValues("type") === "mcq" ? "success" : "default"
                      }
                      className="w-1/2 rounded-none rounded-l-lg"
                      onClick={() => {
                        form.setValue("type", "mcq");
                      }}
                      type="button"
                    >
                      <CopyCheck className="w-4 h-4 mr-2" /> Multiple Choice
                    </Button>
                    <Divider orientation="vertical" />
                    <Button
                      color={
                        form.getValues("type") === "open_ended"
                          ? "success"
                          : "default"
                      }
                      className="w-1/2 rounded-none rounded-r-lg"
                      onClick={() => form.setValue("type", "open_ended")}
                      type="button"
                    >
                      <BookOpen className="w-4 h-4 mr-2" /> Open Ended
                    </Button>
                  </div>
                )}
              />
              <Button color="success" isLoading={isLoading} type="submit">
                Submit
              </Button>
            </form>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default QuizCreation;
