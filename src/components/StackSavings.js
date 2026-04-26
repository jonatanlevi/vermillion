import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PLAY_AREA_HEIGHT = 350;
const LAYER_HEIGHT = 30;
const TOTAL_LAYERS = 7;
const INITIAL_WIDTH = SCREEN_WIDTH * 0.8;
const INITIAL_SPEED = 2000;
const SPEED_DECREMENT = 200;
const MIN_SPEED = 600;
const MIN_OVERLAP = 10;
const BASE_X = (SCREEN_WIDTH - INITIAL_WIDTH) / 2;

function getLayerColor(index) {
  const ratio = index / (TOTAL_LAYERS - 1);
  const r = Math.round(192 + (212 - 192) * ratio);
  const g = Math.round(57 + (175 - 57) * ratio);
  const b = Math.round(43 + (55 - 43) * ratio);
  return `rgb(${r},${g},${b})`;
}

export default function StackSavings({ onFinish }) {
  const [layers, setLayers] = useState([
    { x: BASE_X, width: INITIAL_WIDTH },
  ]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const blockX = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);
  const blockXValue = useRef(0);
  const layersRef = useRef(layers);
  const gameOverRef = useRef(false);
  const wonRef = useRef(false);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  const startAnimation = useCallback((currentSpeed, blockWidth) => {
    if (animRef.current) animRef.current.stop();
    const maxTravel = SCREEN_WIDTH - blockWidth;
    blockX.setValue(0);
    blockXValue.current = 0;

    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(blockX, {
          toValue: maxTravel,
          duration: currentSpeed,
          useNativeDriver: true,
        }),
        Animated.timing(blockX, {
          toValue: 0,
          duration: currentSpeed,
          useNativeDriver: true,
        }),
      ])
    );
    animRef.current = anim;
    anim.start();

    blockX.addListener(({ value }) => {
      blockXValue.current = value;
    });
  }, [blockX]);

  useEffect(() => {
    const topLayer = layers[layers.length - 1];
    startAnimation(speed, topLayer.width);
    return () => {
      if (animRef.current) animRef.current.stop();
      blockX.removeAllListeners();
    };
  }, []);

  const handleTap = useCallback(() => {
    if (gameOverRef.current || wonRef.current) return;

    const currentLayers = layersRef.current;
    const topLayer = currentLayers[currentLayers.length - 1];
    const blockWidth = topLayer.width;
    const currentX = blockXValue.current;

    const overlapStart = Math.max(currentX, topLayer.x);
    const overlapEnd = Math.min(currentX + blockWidth, topLayer.x + topLayer.width);
    const overlapWidth = overlapEnd - overlapStart;

    if (overlapWidth <= MIN_OVERLAP) {
      gameOverRef.current = true;
      if (animRef.current) animRef.current.stop();
      const finalScore = currentLayers.slice(1).reduce((sum, l) => sum + l.width, 0);
      setScore(Math.round(finalScore));
      setGameOver(true);
      return;
    }

    const newLayer = { x: overlapStart, width: overlapWidth };
    const newLayers = [...currentLayers, newLayer];
    const layerIndex = newLayers.length - 1;

    if (layerIndex >= TOTAL_LAYERS) {
      wonRef.current = true;
      if (animRef.current) animRef.current.stop();
      const finalScore = newLayers.slice(1).reduce((sum, l) => sum + l.width, 0);
      setScore(Math.round(finalScore));
      setLayers(newLayers);
      setWon(true);
      return;
    }

    const newSpeed = Math.max(INITIAL_SPEED - (layerIndex - 1) * SPEED_DECREMENT, MIN_SPEED);
    setLayers(newLayers);
    setSpeed(newSpeed);

    if (animRef.current) animRef.current.stop();
    blockX.removeAllListeners();
    startAnimation(newSpeed, overlapWidth);
  }, [blockX, startAnimation]);

  const handleRestart = useCallback(() => {
    gameOverRef.current = false;
    wonRef.current = false;
    const initialLayers = [{ x: BASE_X, width: INITIAL_WIDTH }];
    layersRef.current = initialLayers;
    setLayers(initialLayers);
    setGameOver(false);
    setWon(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    if (animRef.current) animRef.current.stop();
    blockX.removeAllListeners();
    startAnimation(INITIAL_SPEED, INITIAL_WIDTH);
  }, [blockX, startAnimation]);

  const isFinished = gameOver || won;
  const topLayer = layers[layers.length - 1];
  const stackedCount = layers.length - 1;

  const renderLayers = () => {
    return layers.slice(1).map((layer, i) => {
      const colorIndex = i;
      const bottomOffset = i * LAYER_HEIGHT;
      return (
        <View
          key={i}
          style={[
            styles.layer,
            {
              left: layer.x,
              width: layer.width,
              bottom: bottomOffset,
              backgroundColor: getLayerColor(colorIndex),
            },
          ]}
        />
      );
    });
  };

  const renderMovingBlock = () => {
    if (isFinished) return null;
    const blockWidth = topLayer.width;
    return (
      <Animated.View
        style={[
          styles.movingBlock,
          {
            width: blockWidth,
            backgroundColor: getLayerColor(stackedCount),
            transform: [{ translateX: blockX }],
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>מגדל החיסכון</Text>
      <Text style={styles.subtitle}>
        {isFinished ? '' : `שכבה ${stackedCount + 1} מתוך ${TOTAL_LAYERS}`}
      </Text>

      <View style={styles.playArea}>
        {renderMovingBlock()}
        <View style={styles.stackArea}>{renderLayers()}</View>
      </View>

      {!isFinished && (
        <TouchableOpacity style={styles.tapButton} onPress={handleTap} activeOpacity={0.8}>
          <Text style={styles.tapButtonText}>הנח שכבה</Text>
        </TouchableOpacity>
      )}

      {won && (
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>🏆</Text>
          <Text style={styles.resultTitle}>שבוע חיסכון מושלם!</Text>
          <Text style={styles.resultSubtitle}>ניצחת את המגדל בכל 7 שכבות</Text>
          <Text style={styles.scoreText}>ניקוד: {score}</Text>
          <TouchableOpacity style={styles.finishButton} onPress={() => onFinish(score)}>
            <Text style={styles.finishButtonText}>סיים ← חתום זמן</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
            <Text style={styles.restartButtonText}>שחק שוב</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameOver && (
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>💸</Text>
          <Text style={styles.resultTitle}>נפל המגדל</Text>
          <Text style={styles.resultSubtitle}>הגעת ל-{stackedCount} שכבות מתוך {TOTAL_LAYERS}</Text>
          <Text style={styles.scoreText}>ניקוד: {Math.round(score / 10)}</Text>
          <TouchableOpacity style={styles.finishButton} onPress={() => onFinish(Math.round(score / 10))}>
            <Text style={styles.finishButtonText}>סיים ← חתום זמן</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
            <Text style={styles.restartButtonText}>נסה שוב</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 16,
  },
  playArea: {
    width: SCREEN_WIDTH,
    height: PLAY_AREA_HEIGHT,
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1E1E1E',
    overflow: 'hidden',
    position: 'relative',
  },
  movingBlock: {
    position: 'absolute',
    top: 10,
    height: LAYER_HEIGHT,
    borderRadius: 8,
    left: 0,
  },
  stackArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TOTAL_LAYERS * LAYER_HEIGHT,
  },
  layer: {
    position: 'absolute',
    height: LAYER_HEIGHT,
    borderRadius: 8,
  },
  tapButton: {
    marginTop: 24,
    backgroundColor: '#C0392B',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 24,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  tapButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  resultCard: {
    marginTop: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    padding: 24,
    alignItems: 'center',
    width: SCREEN_WIDTH - 40,
  },
  resultEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 20,
  },
  finishButton: {
    backgroundColor: '#C0392B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  restartButton: {
    backgroundColor: '#222222',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  restartButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888888',
    textAlign: 'center',
  },
});
