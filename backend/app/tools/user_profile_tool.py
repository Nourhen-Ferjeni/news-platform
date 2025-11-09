from langchain.tools import BaseTool
from sqlalchemy.orm import Session
from .. import crud, models, schemas
from ..database import SessionLocal
from langchain_google_genai import ChatGoogleGenerativeAI
from ..config import GEMINI_API_KEY

class UserProfileTool(BaseTool):
    name: str = "user_profile_tool"
    description: str = "A tool to manage user profiles, including reading and updating their interests."

    def _run(self, tool_input: str):
        import json
        data = json.loads(tool_input)
        user_id = data.get("user_id")
        conversation_history = data.get("conversation_history")
        db: Session = SessionLocal()
        user = crud.get_user(db, user_id=user_id)
        if not user:
            return "User not found."

        print(f"Current interests: {user.profile.get('interests', [])}")

        llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=GEMINI_API_KEY)
        
        prompt = f"""
        Analyze this conversation. The user's current known interests are `{user.profile.get("interests", [])}`.
        The latest conversation is:
        {conversation_history}
        
        Based on this, update the list of interests. The list should be concise and high-level.
        Return only a single, updated JSON array of strings.
        """
        
        response = llm.invoke(prompt)
        print(f"LLM response: {response.content}")
        
        try:
            # Clean the response content
            cleaned_content = response.content.strip().replace("`", "").replace("json", "")
            new_interests = json.loads(cleaned_content)
            if isinstance(new_interests, list):
                print(f"New interests: {new_interests}")
                user.profile["interests"] = new_interests
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(user, "profile")
                db.commit()
                return "User profile updated."
            else:
                return "Failed to update user profile."
        except:
            return "Failed to update user profile."

    async def _arun(self, tool_input: str):
        # For async compatibility
        return self._run(tool_input)
