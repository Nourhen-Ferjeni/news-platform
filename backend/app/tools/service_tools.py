from langchain.tools import BaseTool
# Import the service functions and classes directly
from ..services import content_processor, fake_news_checker, deep_analyzer, model_loader

class DeepAnalysisTool(BaseTool):
    name: str = "deep_analysis_tool"
    description: str = "A tool to perform a deep analysis of an article."

    def _run(self, text: str):
        # Instantiate the analysis tool with the pre-loaded models
        analysis_tool = deep_analyzer.AnalysisTool(
            ner_model=model_loader.model_loader.ner_model,
            ner_tokenizer=model_loader.model_loader.ner_tokenizer,
            llm_model=model_loader.model_loader.llm_model,
            llm_tokenizer=model_loader.model_loader.llm_tokenizer,
            generator=model_loader.model_loader.generator,
            device=model_loader.model_loader.device,
            has_gpu=model_loader.model_loader.has_gpu
        )
        return analysis_tool.run(text)

    async def _arun(self, text: str):
        # For simplicity, the async version just calls the sync version.
        # In a production environment, you might want a true async implementation.
        return self._run(text)

class FakeNewsCheckTool(BaseTool):
    name: str = "fake_news_check_tool"
    description: str = "A tool to check for fake news in a claim."

    def _run(self, claim: str):
        # Call the function directly
        return fake_news_checker.verify_claim(claim)

    async def _arun(self, claim: str):
        return self._run(claim)

class ExtractContentTool(BaseTool):
    name: str = "extract_content_tool"
    description: str = "A tool to extract the main content from a URL."

    def _run(self, url: str):
        # Call the function directly
        return content_processor.extract_content(url)

    async def _arun(self, url: str):
        return self._run(url)

class SummarizeTool(BaseTool):
    name: str = "summarize_tool"
    description: str = "A tool to summarize a text."

    def _run(self, text: str):
        # Call the function directly
        return content_processor.summarize_text(text)

    async def _arun(self, text: str):
        return self._run(text)
