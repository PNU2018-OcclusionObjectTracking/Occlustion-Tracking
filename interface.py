from PyQt5 import QtCore, QtGui, QtWidgets
from PyQt5.QtCore import QDir,QPoint,QSize
from PyQt5 import QtWidgets
from PyQt5 import *
from PyQt5.QtWidgets import QGraphicsScene,QApplication,QFileDialog,QMainWindow,QMessageBox,QPushButton,QHBoxLayout
from PyQt5.QtGui import QPixmap
import os

class Ui_MainWindow(QMainWindow):
    def setupUi(self, MainWindow):
        MainWindow.setObjectName("MainWindow")
        MainWindow.resize(1450, 550)
        self.image_Name_list=[]
        self.index = 0
        self.centralwidget = QtWidgets.QWidget(MainWindow)
        self.centralwidget.setObjectName("centralwidget")
        
        self.BeforeButton = QtWidgets.QPushButton(self.centralwidget)
        self.BeforeButton.setGeometry(QtCore.QRect(1340, 200, 89, 25))
        self.BeforeButton.setObjectName("BeforeButton")
        self.BeforeButton.clicked.connect(self.move_Before)

        self.AfterButton = QtWidgets.QPushButton(self.centralwidget)
        self.AfterButton.setGeometry(QtCore.QRect(1340, 240, 89, 25))
        self.AfterButton.setObjectName("AfterButton")
        self.AfterButton.clicked.connect(self.move_After)

        self.graphicsView = QtWidgets.QGraphicsView(self.centralwidget)
        self.graphicsView.setGeometry(QtCore.QRect(10, 10, 371, 541))
        self.graphicsView.setObjectName("graphicsView")
        self.graphicsView.resize(444,497)
       
        
        self.graphicsView_2 = QtWidgets.QGraphicsView(self.centralwidget)
        self.graphicsView_2.setGeometry(QtCore.QRect(450, 10, 371, 541))
        self.graphicsView_2.setObjectName("graphicsView_2")
        self.graphicsView_2.resize(444,497)
		
        self.graphicsView_3 = QtWidgets.QGraphicsView(self.centralwidget)
        self.graphicsView_3.setGeometry(QtCore.QRect(890, 10, 371, 541))
        self.graphicsView_3.setObjectName("graphicsView_2")
        self.graphicsView_3.resize(444,497)
        #642,490
        MainWindow.setCentralWidget(self.centralwidget)
        self.menubar = QtWidgets.QMenuBar(MainWindow)
        self.menubar.setNativeMenuBar(False)
        self.menubar.setGeometry(QtCore.QRect(0, 0, 784, 22))
        self.menubar.setObjectName("menubar")
        self.menuFile = QtWidgets.QMenu(self.menubar)
        self.menuFile.setObjectName("menuFile")
        MainWindow.setMenuBar(self.menubar)
        self.actionOpen = QtWidgets.QAction(MainWindow)
        self.actionOpen.setObjectName("actionOpen")
        self.actionOpen.triggered.connect(self.showDialog)
        self.actionExit = QtWidgets.QAction(MainWindow)
        self.actionExit.setObjectName("actionExit")
        self.actionExit.triggered.connect(QApplication.quit)
        self.menuFile.addAction(self.actionOpen)
        self.menuFile.addAction(self.actionExit)
        self.menubar.addAction(self.menuFile.menuAction())

        self.retranslateUi(MainWindow)
        QtCore.QMetaObject.connectSlotsByName(MainWindow)

    def showDialog(self):
        #fileName = QFileDialog.getOpenFileName(self,'open file','/home/csh1man/interface/data')[0]
        #fileName = QFileDialog.getOpenFileNames(self,'open file',QDir.homePath()+"/image/test1")
        fileName = QFileDialog.getOpenFileNames(self,'open file',"/home/visbic/double/darknet/data")
        
        #print(fileName[0]) #/home/csh1man/interface/data/image3.png
        
        image_list = open("list.txt","w")
        
        for i in fileName[0]:
            temp = i.split("/")
            temp2 = i[-1]
            temp3 = i.split('.')
            if(temp3[-1] =="txt"): 
               continue
            #image_Path =temp[-3]+"/"+temp[-2]+"/"+temp[-1]
            image_Path =temp[-2]+"/"+temp[-1]
            self.image_Name_list.append(temp[-1])
            image_list.write(image_Path+'\n')
           # print(self.image_Name_list[self.index],sep='\n')
            #self.index = self.index +1
            

        image_list.close()
        os.system("sh detect.sh")

        #fileList = fileName.split("/")
        #imageFile = fileList[-1]
        
        
        #Name_temp = imageFile.split(".")
        #imageName = Name_temp[-2]
        #filePath = '/home/csh1man/output/'
        #fail_Output_Filepath ='/home/csh1man/fail_output/' 
        self.scene = QGraphicsScene()
        self.scene2 = QGraphicsScene()
        self.scene3 = QGraphicsScene() 
        
        self.qpixmap1 = QPixmap(QDir.homePath()+"/double/darknet/pretrain_output/data/"+self.image_Name_list[0])
        self.qpixmap1 = self.qpixmap1.scaled(436,494)

        self.qpixmap2 = QPixmap(QDir.homePath()+"/double/darknet/occluded_output/data/"+self.image_Name_list[0])          
        self.qpixmap2 = self.qpixmap2.scaled(436,494)
        
        self.qpixmap3= QPixmap(QDir.homePath()+"/double/darknet/output/data/"+self.image_Name_list[0])
        self.qpixmap3 = self.qpixmap3.scaled(438,494)

       
          
        self.scene.addPixmap(self.qpixmap1)
        self.scene2.addPixmap(self.qpixmap2)
          

        self.graphicsView.setScene(self.scene)
        self.graphicsView_2.setScene(self.scene2)  
          
        self.scene3.addPixmap(self.qpixmap3)
        self.graphicsView_3.setScene(self.scene3)
          

        
    def move_Before(self):
        if(self.index == 0):
           self.index = len(self.image_Name_list)-1
           #print("len: "+len(self.image_Name_list))
           print(self.image_Name_list[self.index])
        elif(self.index >0):
           self.index = self.index -1;
           print(self.image_Name_list[self.index]) 
        #self.scene.clear()
        #self.scene2.clear()
        #self.scene3.clear()
        self.qpixmap1 = QPixmap(QDir.homePath()+"/double/darknet/pretrain_output/data/"+self.image_Name_list[self.index])
        self.qpixmap1 = self.qpixmap1.scaled(436,494)

        self.qpixmap2 = QPixmap(QDir.homePath()+"/double/darknet/occluded_output/data/"+self.image_Name_list[self.index])          
        self.qpixmap2 = self.qpixmap2.scaled(436,494)
        
        self.qpixmap3= QPixmap(QDir.homePath()+"/double/darknet/output/data/"+self.image_Name_list[self.index])
        self.qpixmap3 = self.qpixmap3.scaled(438,494)
        
        self.scene.addPixmap(self.qpixmap1)
        self.scene2.addPixmap(self.qpixmap2)
          

        self.graphicsView.setScene(self.scene)
        self.graphicsView_2.setScene(self.scene2)  
          
        self.scene3.addPixmap(self.qpixmap3)
        self.graphicsView_3.setScene(self.scene3)
        
    def move_After(self):
        if(self.index == len(self.image_Name_list)-1):
           self.index = 0
           print(self.image_Name_list[self.index])
        elif(self.index <len(self.image_Name_list)):
           self.index = self.index +1;
           print(self.image_Name_list[self.index])
        
        #self.scene.clear()
        #self.scene2.clear()
        #self.scene3.clear()
        self.qpixmap1 = QPixmap(QDir.homePath()+"/double/darknet/pretrain_output/data/"+self.image_Name_list[self.index])
        self.qpixmap1 = self.qpixmap1.scaled(436,494)

        self.qpixmap2 = QPixmap(QDir.homePath()+"/double/darknet/occluded_output/data/"+self.image_Name_list[self.index])          
        self.qpixmap2 = self.qpixmap2.scaled(436,494)
        
        self.qpixmap3= QPixmap(QDir.homePath()+"/double/darknet/output/data/"+self.image_Name_list[self.index])    
        self.qpixmap3 = self.qpixmap3.scaled(436,494)
        self.scene.addPixmap(self.qpixmap1)
        self.scene2.addPixmap(self.qpixmap2)
          

        self.graphicsView.setScene(self.scene)
        self.graphicsView_2.setScene(self.scene2)  
          
        self.scene3.addPixmap(self.qpixmap3)
        self.graphicsView_3.setScene(self.scene3)
        

    def retranslateUi(self, MainWindow):
        _translate = QtCore.QCoreApplication.translate
        MainWindow.setWindowTitle(_translate("MainWindow", "Occluded Object detection"))
        self.menuFile.setTitle(_translate("MainWindow", "File"))
        self.actionOpen.setText(_translate("MainWindow", "Open"))
        self.actionExit.setText(_translate("MainWindow", "Exit"))
        self.BeforeButton.setText(_translate("MainWindow", "Before"))
        self.AfterButton.setText(_translate("MainWindow", "After"))
        

if __name__ == "__main__":
    import sys
    app = QtWidgets.QApplication(sys.argv)
    MainWindow = QtWidgets.QMainWindow()
    ui = Ui_MainWindow()
    ui.setupUi(MainWindow)
    MainWindow.show()
    sys.exit(app.exec_())

