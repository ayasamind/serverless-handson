'use client'
import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MobileStepper from '@mui/material/MobileStepper';
import Button from '@mui/material/Button';
import SwipeableViews from 'react-swipeable-views';
import { autoPlay } from 'react-swipeable-views-utils';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import ImageListItem from '@mui/material/ImageListItem';
import './top.css'

const AutoPlaySwipeableViews = autoPlay(SwipeableViews);

let images: Array<any> = [];
const apiGatewayUrl: string = process.env.NEXT_PUBLIC_IMAGES_URL as string;
const websocketApiGatewayUrl: string = process.env.NEXT_PUBLIC_WEBSOCKET_APIGATEWAY_URL as string;

const getImageFromS3 = async (apiUrl: string) => {
  const res = await fetch(apiUrl);
  const data = await res.json()
  return data;
}

const addImageAndProfile = (objectKey: string) => {
  const s3Url: string = process.env.NEXT_PUBLIC_S3_URL as string;
  images.unshift(s3Url+objectKey)
}

const SwipeableTextMobileStepper = () => {
  const s3Url: string = process.env.NEXT_PUBLIC_S3_URL as string;
  const [s3images, setImageData] = useState([])
  useEffect(() => {
    getImageFromS3(apiGatewayUrl).then(data => {
      setImageData(data)
    });
  }, [])

  if (images.length === 0) {
    s3images.forEach(image => {
      addImageAndProfile(image["key"]);
    });
  }

  const output = () => {
    images.some((image, index) =>  {
      handleStepChange(index);
      return true;
    })
  }

  const reload = () => window.location.reload();

  const [message, setMessage] = useState('');
  useEffect(() => {
    const socket = new WebSocket(websocketApiGatewayUrl);
    socket.onopen = (event) => {
      // クライアント接続
      console.log("onopen", event);
    };

    socket.onmessage = async (event) => {
      // サーバーからのメッセージ受信時
      console.log("onmessgae", event);
      var data = JSON.parse(event.data);
      await addImageAndProfile(data['key']);
      setTimeout(output, 2000)
    };

    socket.onclose = (event) => {
      // クライアント切断時
      console.log("onclose", event);
      setMessage('WebSocket接続が切断されました')
      setTimeout(reload, 2000)
    };
  }, []);

  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const maxSteps = images.length;
  const handleStepChange = (step: number) => {
    setActiveStep(step);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
      <Box sx={{ maxWidth: 'auto', flexGrow: 1 }}>
        <AutoPlaySwipeableViews
            axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
            index={activeStep}
            onChangeIndex={handleStepChange}
            enableMouseEvents
            interval={7500}
        >
          {images.map((image, index) => (
            <div key={index}>
              {Math.abs(activeStep - index) <= 2 ? (
                <ImageListItem key={image}>
                <img
                    src={`${image}?w=248&fit=crop&auto=format`}
                    srcSet={`${image}?w=248&fit=crop&auto=format&dpr=2 2x`}
                    alt={image}
                    loading="lazy"
                    style={{
                      display: 'block',
                      overflow: 'hidden',
                      width: 'auto',
                      height: '1025px',
                      margin: 'auto', 
                    }}
                />
                </ImageListItem>
              ) : null}
            </div>
          ))}
        </AutoPlaySwipeableViews>
        <MobileStepper
            variant="progress"
            steps={maxSteps}
            position="static"
            activeStep={activeStep}
            nextButton={
              <Button
                size="small"
                onClick={handleNext}
                disabled={activeStep === maxSteps - 1}
              >
                Next {message}
                {theme.direction === 'rtl' ? (
                  <KeyboardArrowLeft />
                ) : (
                  <KeyboardArrowRight />
                )}
              </Button>
            }
            backButton={
              <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
                {theme.direction === 'rtl' ? (
                  <KeyboardArrowRight />
                ) : (
                  <KeyboardArrowLeft />
                )}
                Back
              </Button>
            }
        />
      </Box>
  );
}

export default SwipeableTextMobileStepper;