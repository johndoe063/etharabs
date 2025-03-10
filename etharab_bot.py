# pip install python-telegram-bot
import logging
import os
import time
import datetime
import subprocess
import signal
import sys
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
    handlers=[
        logging.FileHandler("bot.log"),
        logging.StreamHandler()
    ]
)
# Set higher logging level for httpx to avoid excessive info logs
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# Set your Telegram token here
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "7902982332:AAGq1zs6LZJUWqRdvZBeEZrXfl5aQ3V18Dk")
# Set your webapp URL - use the correct format for mini apps
WEBAPP_URL = os.environ.get("WEBAPP_URL", "https://t.me/etharab_bot?startapp")

# Global flag for bot termination
should_stop = False

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Directly launches the mining web app when /start command is issued."""
    try:
        user = update.effective_user

        # Log for debugging
        logger.info(f"Start command received from user: {user.id} - {user.first_name}")

        # Create a keyboard with a button that directly navigates to the specific URL
        keyboard = [
            [
                InlineKeyboardButton("⚡ ابدأ التعدين الآن ⚡", url="https://t.me/etharab_bot?startapp")
            ],
        ]

        reply_markup = InlineKeyboardMarkup(keyboard)

        # Arabic welcome message with attractive earnings claims
        welcome_message = (
            f"👋 *مرحباً {user.first_name}!*\n\n"
            "🚀 *بوت تعدين الإيثيريوم الأول من نوعه!*\n\n"
            "💰 اربح أكثر من 2000$ يومياً من خلال نظام التعدين المتطور\n"
            "⏱️ يعمل تلقائياً بدون مجهود منك - 24 ساعة يومياً\n"
            "💎 تقنية تعدين سحابية متطورة بأعلى سرعة وكفاءة\n"
            "✅ سحب فوري للأرباح عبر محفظتك الخاصة\n\n"
            "⚡ اضغط على الزر أدناه لبدء الربح الآن!")

        logger.info(f"Sending direct mining launch message to user {user.id} with WebApp URL: https://t.me/etharab_bot?startapp")

        await update.message.reply_text(welcome_message,
                                        reply_markup=reply_markup,
                                        parse_mode="Markdown")
    except Exception as e:
        logger.error(f"Error in start handler: {e}")
        # Send a simplified message if there's an error
        await update.message.reply_text(
            "Welcome to ETH Mining Bot! Something went wrong with the interactive button. Please try again later."
        )

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle button presses."""
    query = update.callback_query
    await query.answer()

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle errors in the telegram-python-bot library."""
    logger.error(f"Exception while handling an update: {context.error}")

    # Log the error before we do anything else, so we can see it even if something breaks
    logger.error(msg="Exception while handling an update:", exc_info=context.error)

    # Log additional context if available
    if update:
        logger.error(f"Update that caused error: {update}")

    # Print an error to the console
    print(f"ERROR: {context.error}")

# Self-healing mechanism
def run_bot_with_restart():
    """Run the bot with automatic restart capabilities."""
    global should_stop
    
    while not should_stop:
        try:
            logger.info("Starting bot...")
            
            # Create the Application and pass it your bot's token
            application = Application.builder().token(TOKEN).build()

            # Add handlers
            application.add_handler(CommandHandler("start", start))
            application.add_handler(CallbackQueryHandler(button_callback))
            application.add_error_handler(error_handler)

            # Run the bot until the user presses Ctrl-C or we receive a stop signal
            logger.info("Bot is starting up with persistent connection!")
            application.run_polling(
                allowed_updates=["message", "callback_query", "inline_query"],
                drop_pending_updates=True,
                poll_interval=1.0,
                timeout=30,
                stop_signals=[],  # Disable default signal handling
            )
        
        except Exception as e:
            if should_stop:
                logger.info("Bot stopping due to termination request.")
                break
                
            logger.error(f"Bot crashed with error: {e}")
            logger.info("Restarting bot in 10 seconds...")
            time.sleep(10)
        
        # If the bot exits normally without an exception
        if not should_stop:
            logger.info("Bot exited unexpectedly. Restarting in 10 seconds...")
            time.sleep(10)

# Signal handlers
def signal_handler(sig, frame):
    """Handle termination signals."""
    global should_stop
    logger.info(f"Received signal {sig}, initiating graceful shutdown...")
    should_stop = True

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

if __name__ == "__main__":
    logger.info("Bot service starting...")
    
    # Set up keep-alive mechanism for PythonAnywhere
    # This creates a touch file that PythonAnywhere can use to verify the script is still running
    def update_keepalive():
        while not should_stop:
            with open("bot_keepalive", "w") as f:
                f.write(str(int(time.time())))
            time.sleep(60)
    
    # Start keepalive in a separate thread
    import threading
    keepalive_thread = threading.Thread(target=update_keepalive)
    keepalive_thread.daemon = True
    keepalive_thread.start()
    
    # Run the bot with restart capability
    run_bot_with_restart()
    
    logger.info("Bot service has been terminated.")
