package fi.liikennevirasto.digiroad2.asset

import org.joda.time.LocalDate
import scala.xml.{NodeSeq, Elem}

case class AssetType(id: Long, assetTypeName: String, geometryType: String)
case class Asset(id: Long, externalId: Option[Long], assetTypeId: Long, lon: Double, lat: Double, roadLinkId: Long,
                 imageIds: Seq[String] = List(), bearing: Option[Int] = None, validityDirection: Option[Int] = None,
                 status: Option[String] = None, readOnly: Boolean = true,
                 municipalityNumber: Option[Int] = None, validityPeriod: Option[String] = None)

case class AssetWithProperties(id: Long, externalId: Option[Long], assetTypeId: Long, lon: Double, lat: Double, roadLinkId: Long,
                 imageIds: Seq[String] = List(), bearing: Option[Int] = None, validityDirection: Option[Int] = None,
                 status: Option[String] = None, readOnly: Boolean = true,
                 municipalityNumber: Option[Int] = None,
                 propertyData: Seq[Property] = List(), validityPeriod: Option[String] = None,
                 wgslon: Double, wgslat: Double) {
  def propertiesAsXML = {
    <properties>
      {propertyData.map(_.toXML)}
    </properties>

  }
}

case class SimpleProperty(publicId: String, values: Seq[PropertyValue])
case class Property(id: Long, publicId: String, propertyType: String, propertyUiIndex: Int = 9999, required: Boolean = false, values: Seq[PropertyValue]) {
  def toXML = {
    <property>
      <id>{id}</id>
      <publicId>{publicId}</publicId>
      <propertyType>{propertyType}</propertyType>
      <propertyUiIndex>{propertyUiIndex}</propertyUiIndex>
      <required>{required}</required>
      <values>{values.map(_.toXML)}</values>
    </property>

  }
}
object Property {
  def propertiesFromXML(propertiesElem: Elem): Seq[Property] = {
    val properties = (propertiesElem \\ "property")
    properties.map { p =>
      val id = (p \ "id").text.toLong
      val publicId = (p \ "publicId").text
      val propertyType = (p \ "propertyType").text
      val propertyUiIndex = (p \ "propertyUiIndex").text.toInt
      val required = (p \ "required").text.toBoolean
      Property(id, publicId, propertyType, propertyUiIndex, required, valuesFromXML(p \ "values"))
    }
  }

  def valuesFromXML(valuesSeq: NodeSeq) = {
    (valuesSeq \\ "value").map { p =>
      val propertyValue = (p \ "propertyValue").text
      val propertyDisplayValue = (p \ "propertyDisplayValue").text
      val imageId = (p \ "imageId").text
      PropertyValue(propertyValue, if (propertyDisplayValue.isEmpty) { None } else { Some(propertyDisplayValue) }, if (imageId.isEmpty) null else imageId)
    }
  }
}
case class PropertyValue(propertyValue: String, propertyDisplayValue: Option[String] = None, imageId: String = null) {
  def toXML = {
    <value>
      <propertyValue>{propertyValue}</propertyValue>
      { if (propertyDisplayValue.isDefined) { <propertyDisplayValue>{propertyDisplayValue.get}</propertyDisplayValue> }}
      <imageId>{imageId}</imageId>
    </value>

  }
}
case class EnumeratedPropertyValue(propertyId: Long, publicId: String, propertyName: String, propertyType: String, required: Boolean = false, values: Seq[PropertyValue])
case class RoadLink(id: Long, lonLat: Seq[(Double, Double)], endDate: Option[LocalDate] = None, municipalityNumber: Int)

object PropertyTypes {
  val SingleChoice = "single_choice"
  val MultipleChoice = "multiple_choice"
  val Text = "text"
  val LongText = "long_text"
  val ReadOnlyText = "read_only_text"
  val Date = "date"
}

object AssetStatus {
  val Floating = "floating"
}

object ValidityPeriod {
  val Past = "past"
  val Current = "current"
  val Future = "future"
}
