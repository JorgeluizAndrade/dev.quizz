import MCQ from "@/components/MCQ";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextauth";
import { redirect } from "next/navigation";
import React from "react";
import type { Metadata } from "next";


type Props = {
  params: {
    gameId: string;
  };
};

export const metadata: Metadata = {
  title: "Multiple choice Game | Dev.Quizz"
};

const MCQPage = async ({ params: { gameId } }: Props) => {
  const session =  await getAuthSession();
  if(!session){
    redirect('/')
  }


  const game = await prisma.game.findUnique({
    where: {
      id:gameId
    },
    include: {
      questions:{
        select: {
          id: true,
          question: true,
          options: true,
        }
      }
    }
  })

  if (!game || game.gameType === "open_ended") {
    return redirect("/quiz");
  }
  return <MCQ game={game} />

};

export default MCQPage;
