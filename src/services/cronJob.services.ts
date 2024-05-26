import cron from "node-cron";
import UserModel, { IUser } from "../models/user.model";

import mempoolJS from "@mempool/mempool.js";
import { ITransaction, TransactionModel } from "../models/transaction.model";
import {
  sendSubscriptionExpirationReminder,
  sendTransactionVerificationEmail,
} from "../middleware/nodemailer";
import { getCronCollectionData } from "../controller/magicEden.controler";

const {
  bitcoin: { transactions, mempool },
} = mempoolJS({
  hostname: "mempool.space",
  network: "testnet",
});

const checkTransactionVerification = async (txid: string): Promise<boolean> => {
  const txStatus = await transactions.getTxStatus({ txid });
  console.log(txStatus);

  return txStatus.confirmed;
};

async function updateSubscription(transaction: ITransaction) {
  const currentDate = new Date();

  const { purchase_date, expiration_date, plan } = transaction;

  const user = await UserModel.findById(transaction.user);

  // Check if user has an existing plan
  if (user?.expiration_date && user.expiration_date > currentDate) {
    user.expiration_date.setDate(
      user.expiration_date.getDate() + expiration_date.getDate()
    );
  } else {
    user!.expiration_date = expiration_date;
    user!.current_plan = {
      plan: plan.plan,
      type: plan.type,
    };
    user!.subscription_status = true;
  }

  user!.purchase_date = purchase_date;

  await user!.save();
}

// checkTransactionVerification("de665cb8e417f22835ead47d6a0ce4142c66f4e5e8e140b2d58f84ad42d8dff3");

export function scheduleTransactionVerificationCheck() {
  const job = cron.schedule(`*/5 * * * *`, async () => {
    try {
      const currentDate = new Date();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const transactionsToProcess = await TransactionModel.find({
        isVerified: false,
        purchase_date: { $gte: threeDaysAgo, $lte: currentDate },
      }).populate("user");

      await Promise.all(
        transactionsToProcess.map(async (transaction) => {
          const txHash = transaction.hash;

          const isVerified = await checkTransactionVerification(txHash);

          if (isVerified) {
            transaction.isVerified = true;
            await transaction.save();
            console.log(
              `Transaction ${txHash} verified for user ${transaction.user}.`
            );
            updateSubscription(transaction);

            //send transaction verified mail to the user
            const user = await UserModel.findById(transaction.user);
            console.log("sending mail to the user");
            sendTransactionVerificationEmail(user!.email, txHash);
            console.log("sent mail to the user");
          } else {
            const mempoolTxids = await getMempoolTransactionIds();
            const isTransactionInMempool = mempoolTxids.includes(txHash);

            if (!isTransactionInMempool) {
              console.log(
                `Transaction ${txHash} not found in mempool for user ${transaction.user}.`
              );
            } else {
              console.log(
                `Transaction ${txHash} not verified yet for user ${transaction.user}.`
              );
            }
          }
        })
      );
    } catch (error: any) {
      console.error(`Error checking transaction status:`, error);
      throw new Error(error);
    }
  });
}

// function isWithinLastThreeDays(date: Date): boolean {
//   const threeDaysAgo = new Date();
//   threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
//   return date >= threeDaysAgo;
// }

export function scheduleSubscriptionUpdate() {
  cron.schedule("0 0 */6 * * *", async () => {
    try {
      const currentDate = new Date();

      const expiredUsers = await UserModel.find({
        expiration_date: { $lt: currentDate },
        subscription_status: true,
      });

      await Promise.all(
        expiredUsers.map(async (user: IUser) => {
          user.subscription_status = false;
          user.current_plan = null;
          await user.save();
          console.log(`Subscription expired for user ${user._id}`);
        })
      );

      const usersEndingSoon = await UserModel.find({
        expiration_date: {
          $gte: currentDate, // Today or in the future
          $lte: new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000), // Up to 3 days from now
        },
        subscription_status: true,
      });

      await Promise.all(
        usersEndingSoon.map(async (user: IUser) => {
          const daysRemaining = Math.ceil(
            (user.expiration_date.getTime() - currentDate.getTime()) /
              (24 * 60 * 60 * 1000)
          );
          const message =
            daysRemaining === 0
              ? "Your subscription plan will expire today."
              : `${daysRemaining} day(s) left for your current subscription.`;
          await sendSubscriptionExpirationReminder(user.email, message);
          console.log(`Sent email reminder to user ${user._id}`);
        })
      );
    } catch (error) {
      console.error("Error updating subscription status:", error);
    }
  });
}

const getMempoolTransactionIds = async () => {
  const mempoolTxids = await mempool.getMempoolTxids();
  // console.log(mempoolTxids, ">>>>>>>>> mempoolTxids");
  return mempoolTxids;
};

// getMempoolTransactionIds();

export async function scheduleSavingChartData() {
  try {
    await getCronCollectionData();
    // After the initial execution, schedule the job to run every 15 minutes
    cron.schedule("*/15 * * * *", async () => {
      try {
        await getCronCollectionData();
      } catch (error) {
        console.error("Error fetching and saving data:", error);
      }
    });
  } catch (error) {
    console.error("Error fetching and saving data:", error);
  }
}
