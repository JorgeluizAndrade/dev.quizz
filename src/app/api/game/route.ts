import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextauth";
import { quizCreationSchema } from "@/schemas/form/quiz";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import axios from "axios";
export async function POST(req: NextResponse, res: NextResponse) {

  try {
    const session = await getAuthSession();
    console.log("IN GAME Session data:", session);

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "You must be logged in",
        },
        { status: 401 }
      );
    }
    const body = await req.json();

    const { amount, topic, type } = quizCreationSchema.parse(body);

    const game = await prisma.game.create({
      data: {
        gameType: type,
        timeStarted: new Date(),
        userId: session.user.id,
        topic,
      },
    });
    const { data } = await axios.post(
      `${process.env.API_URL as string}/api/questions`,
      {
        topic,
        amount,
        type,
      },
      {
        withCredentials: true,
        headers: {
          Cookie: req.headers.get("cookie") || "",        
        }

      }
    );
    if (type === "mcq") {
      type mcqQuestion = {
        question: string;
        answer: string;
        option1: string;
        option2: string;
        option3: string;
      };
      const manyData = data.questions.map((question: mcqQuestion) => {
        let options = [
          question.option1,
          question.option2,
          question.option3,
          question.answer,
        ].sort(() => Math.random() - 0.5);
        return {
          question: question.question,
          answer: question.answer,
          options: JSON.stringify(options),
          gameId: game.id,
          questionType: "mcq",
        };
      });

      await prisma.question.createMany({
        data: manyData,
      });

    } else if (type === "open_ended") {
      type openQuestion = {
        question: string;
        answer: string;
      };

      const open_endedQuestion = data.questions.map((question: openQuestion) => {
        return {
          question: question.question,
          answer: question.answer,
          gameId: game.id,
          questionType: "open_ended",
        }
      })

      await prisma.question.createMany({ data: open_endedQuestion });
    }

    return NextResponse.json({ gameId: game.id }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    } else {
      console.log(error)
      return NextResponse.json(
        { error: "An unexpected error occurred." },
        { status: 500 }
      );
    }
  }
}


export async function GET(req: Request, res: Response) {
  try {
    const url = new URL(req.url);
    const gameId = url.searchParams.get("gameId");
    if (!gameId) {
      return NextResponse.json(
        { error: "You must provide a game id." },
        {
          status: 400,
        }
      );
    }

    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
      include: {
        questions: true,
      },
    });
    if (!game) {
      return NextResponse.json(
        { error: "Game not found." },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      { game },
      {
        status: 400,
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      {
        status: 500,
      }
    );
  }
}
