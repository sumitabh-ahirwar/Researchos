from backend.agents import build_search_agent, build_reader_agent, writer_chain, critic_chain


def run_pipeline(topic: str) -> dict:
    state = {}
    
    search_agent = build_search_agent()
    search_results = search_agent.invoke({
        "messages" : [("user", f"Find recent , reliable and detailed information about {topic}")]
    })
    state['search_results'] = search_results["messages"][-1].content
    

    #step2
    
   
    reader_agent = build_reader_agent()
    reader_result = reader_agent.invoke({
        "messages" : [("user",
            f"Based on the following search results about {topic}, "
            f"pick the most relevant URLs and scrape it for deeper content. \n\n"
            f"Search Results:\n{state['search_results'][:800]}")]
    })
    state["scraped_content"] = reader_result["messages"][-1].content
   
    
    #steps3
    
    print("\n" + "=" * 50)
    print(f"Starting writing phase for topic: {topic}")
    print("="*50 + "\n")
    
    research_combined = (f"Search Results:\n{state['search_results']}\n\n"
        f"Scraped Content:\n{state['scraped_content']}")
    
    
    state["report"] = writer_chain.invoke({
        "topic": topic,
        "research": research_combined
    })
    
    
    
    state["feedback"] = critic_chain.invoke({
        "report": state["report"]
    })
    
    return state

if __name__ == "__main__":
    topic = input("Enter a topic to research: ")
    run_pipeline(topic)