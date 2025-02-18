import React, { useState, useEffect } from 'react';
import { Moon, Sun, Check, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
const FlashcardApp = () => {
  const token = localStorage.getItem('token');
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dueCards, setDueCards] = useState([]);
  const [notification,  setNotification] = useState(null);
  const [right,setRight] = useState(false)
  const [newCard, setNewCard] = useState(null);
  const [showNewCard, setShowNewCard] = useState(false);

  // Calculate next review date based on box level (spaced repetition)
  const calculateNextReview = (box) => {
    const today = new Date();
    switch (box) {
      case 1: return new Date(today.setDate(today.getDate() + 1));
      case 2: return new Date(today.setDate(today.getDate() + 3));
      case 3: return new Date(today.setDate(today.getDate() + 7));
      case 4: return new Date(today.setDate(today.getDate() + 14));
      case 5: return new Date(today.setDate(today.getDate() + 30));
      default: return new Date(today.setDate(today.getDate() + 1));
    }
  };

  const fetchFlashcards = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/flashcards', {
        method:'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFlashcards(data);
      
      // Filter cards due for review
      const today = new Date();
      const due = data.filter(card => new Date(card.nextReview) <= today);
      setDueCards(due);
    } catch (error) {
      showNotification('Error fetching flashcards', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    fetchFlashcards();
    // Check system dark mode preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, [token]);

  useEffect(() => {
    // Apply dark mode class to body
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleCreateFlashcard = async (e) => {
    e.preventDefault();
    try {
      const cardData = {
        question,
        answer,
        box: 1,
        nextReview: new Date(),
      };

      const response = await fetch('http://localhost:3000/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cardData),
      });
      
      const createdCard = await response.json();
      setNewCard(createdCard);
      setShowNewCard(true);
      setFlashcards([createdCard, ...flashcards]); // Add new card to the beginning
      
      // Clear form
      setQuestion('');
      setAnswer('');
      showNotification('Flashcard created successfully!');
      
      // Update due cards if the new card is due today
      if (new Date(createdCard.nextReview) <= new Date()) {
        setDueCards([...dueCards, createdCard]);
      }
    } catch (error) {
      showNotification('Error creating flashcard', 'error');
    }
  };

  const handleAnswer = async (correct) => {
    console.log('calling');
    // Ensure there is at least one flashcard
    if (!flashcards || flashcards.length === 0) return;
  
    // Use the last flashcard as the current card
    const currentCard = flashcards[flashcards.length - 1];
    console.log('Current Card:', currentCard);
    
    // Leitner logic: if answered correctly, move to the next box; if not, reset to Box 1.
    const newBox = correct ? Math.min(currentCard.box + 1, 5) : 1;
    console.log('Updating card with _id:', currentCard._id);
  
    try {
      // Send update request for the current card to the backend
      const response = await fetch(`http://localhost:3000/api/flashcards/${currentCard._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          correct,
          box: newBox,
          nextReview: calculateNextReview(newBox),
        }),
      });
      
      // Parse the updated card from the backend response
      const updatedCard = await response.json();
      console.log('Backend response (updated card):', updatedCard);
     setNewCard(updatedCard)
      // Update the flashcards state: replace the card that was updated
      const updatedFlashcards = flashcards.map((card) =>
        card._id === updatedCard._id ? updatedCard : card
      );
      setFlashcards(updatedFlashcards);
      setRight(correct);
      // Show a feedback notification
      showNotification(
        correct
          ? `Moved to Box ${newBox}! Next review in ${
              newBox === 5
                ? '30 days'
                : newBox === 4
                ? '14 days'
                : newBox === 3
                ? '7 days'
                : newBox === 2
                ? '3 days'
                : '1 day'
            }`
          : 'Card moved back to Box 1 for review tomorrow',
        correct ? 'success' : 'error'
      );
  
      // Optionally, hide the answer if you are showing it in the UI
      setShowAnswer(false);
  
      // Navigation logic: if you have additional cards to review,
      // update the currentIndex. Otherwise, notify completion and refresh.
      if (currentIndex < dueCards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
        showNotification('Review session completed!');
        fetchFlashcards();
      }
    } catch (error) {
      showNotification('Error updating flashcard', 'error');
    }
  };
  
    // Add box level indicator component
  const BoxLevelIndicator = ({ level }) => {
    return (
      <div className="flex space-x-1 mt-2">
        {[1, 2, 3, 4, 5].map((box) => (
          <div
            key={box}
            className={`h-2 w-4 rounded ${
              box <= level
                ? 'bg-green-500'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };
  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/flashcards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update state to remove the deleted card
      setFlashcards(prev => prev.filter(card => card._id !== id));
      setDueCards(prev => prev.filter(card => card._id !== id));
      showNotification('Flashcard deleted successfully!');
    } catch (error) {
      showNotification('Error deleting flashcard', 'error');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Flashcard Learning System</h1>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg mb-4 ${
              notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            } text-white`}
          >
            {notification.message}
          </motion.div>
        )}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Flashcard</h2>
          <form onSubmit={handleCreateFlashcard} className="space-y-4">
            <input
              type="text"
              placeholder="Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              required
            />
            <textarea
              placeholder="Answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              required
              rows="3"
            />
            <button
              type="submit"
              className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors"
            >
              Create Flashcard
            </button>
          </form>

          <AnimatePresence>
            {showNewCard && newCard && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="bg-green-50 dark:bg-gray-800 border-2 border-green-500 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                      New Card Created Successfully!
                    </h3>
                    <button 
                      onClick={() => setShowNewCard(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-700 rounded p-3">
                      <div className="font-medium text-gray-700 dark:text-gray-200">Question:</div>
                      <div className="mt-1 text-gray-600 dark:text-gray-300">{newCard.question}</div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-700 rounded p-3">
                      <div className="font-medium text-gray-700 dark:text-gray-200">Answer:</div>
                      <div className="mt-1 text-gray-600 dark:text-gray-300">{newCard.answer}</div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{right ? (<p>Initial Level: {newCard.box}</p>):(<p>Reach next Level: {newCard.box}</p>)}</span>
                      <span>{right ? (<p>Next Review: {new Date(newCard.nextReview).toLocaleDateString()}</p>):(<p>Next Review: {newCard.nextReview}</p>)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Section */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Progress</h2>
            <span className="text-blue-500 dark:text-blue-400">
              {dueCards.length} cards due today
            </span>
          </div>
          <div className="mt-2">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(dueCards.length / flashcards.length) * 100 || 0}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Total Cards: {flashcards.length}
            </div>
          </div>
        </div>
        

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Review Flashcards</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {dueCards.length} cards due for review today
          </p>
        </div>

         
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4"
          >
           {flashcards.length > 0 ? (
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">
                  Card {currentIndex + 1} of {flashcards.length}
                </h3>
                <div className="mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Current Box: {flashcards[currentIndex].box}
                  </span>
                  <BoxLevelIndicator level={flashcards[currentIndex].box} />
                </div>
                <p className="text-xl mb-4">{flashcards[currentIndex].question}</p>
                
                {showAnswer ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4"
                  >
                    <p className="text-lg text-blue-600 dark:text-blue-400">
                      {flashcards[currentIndex].answer}
                    </p>
                    <div className="flex justify-center space-x-4 mt-4">
                      <button
                        onClick={() => handleAnswer(false)}
                        className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                      >
                        <X className="w-5 h-5" />
                        <span>Got it Wrong</span>
                      </button>
                      <button
                        onClick={() => handleAnswer(true)}
                        className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                      >
                        <Check className="w-5 h-5" />
                        <span>Got it Right</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Show Answer
                  </button>
                )}

                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Next review: {new Date(flashcards[currentIndex].nextReview).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  No flashcards available. Create some new ones to get started!
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">All Flashcards</h2>
          <div className="space-y-4">
          {flashcards.map((card) => (
             <motion.div
                key={card._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{card.question}</p>
                  <p className="text-gray-600 dark:text-gray-400">{card.answer}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Level: {card.box} | Next review: {new Date(card.nextReview).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(card._id)}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </motion.div>
             
))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardApp;